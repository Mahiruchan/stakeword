// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
}

interface IUSYCTeller {
    function deposit(uint256 usdcAmount) external returns (uint256 usycShares);
    function redeem(uint256 usycShares) external returns (uint256 usdcReturned);
}

/**
 * @title StakeWordVault
 * @notice Protocol-owned vault that books per-commitment USDC stakes and
 *         redistributes failed principal + accrued USYC yield to completers
 *         at season close.
 *
 * @dev Permissioning model:
 *      - `owner` controls Teller plumbing toggles and season rollover.
 *      - `keeper` is the platform-controlled address that books deposits +
 *        records settlements. In our deployment it's the evaluator wallet.
 *
 *      USYC integration is opt-in. While the vault is awaiting allowlist
 *      approval from Circle, set `teller == address(0)` and the vault just
 *      books USDC. Once allowlisted, the owner sets the Teller address and
 *      subsequent deposits convert to USYC, accruing yield for the season pool.
 */
contract StakeWordVault {
    IERC20 public immutable usdc;

    address public owner;
    address public keeper;
    IUSYCTeller public teller; // optional; zero until USYC allowlist clears

    enum Outcome { None, Completed, Failed }

    struct Commitment {
        address staker;            // EOA or Circle wallet owner — receives refund on success
        uint256 principal;         // USDC base units locked
        uint64  recordedAt;
        Outcome outcome;
    }

    // commitmentId (off-chain nanoid hashed to bytes32) → Commitment
    mapping(bytes32 => Commitment) public commitments;

    // Totals updated as records book or settle. Cheap to query for the dashboard.
    uint256 public totalPooled;          // sum of currently pooled USDC
    uint256 public totalSettledSuccess;
    uint256 public totalSettledFailed;   // forfeited principal — feeds completer pool
    uint256 public totalDistributed;

    uint256 public currentSeasonId = 1;

    event DepositRecorded(bytes32 indexed commitmentId, address indexed staker, uint256 principal);
    event Settled(bytes32 indexed commitmentId, Outcome outcome);
    event Distributed(bytes32 indexed commitmentId, address indexed recipient, uint256 amount);
    event TellerUpdated(address indexed newTeller);
    event KeeperUpdated(address indexed newKeeper);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event SeasonAdvanced(uint256 indexed previousSeason, uint256 indexed nextSeason);

    error NotOwner();
    error NotKeeper();
    error AlreadyRecorded();
    error UnknownCommitment();
    error AlreadySettled();
    error ZeroAmount();
    error ZeroAddress();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }
    modifier onlyKeeper() {
        if (msg.sender != keeper) revert NotKeeper();
        _;
    }

    constructor(address _usdc, address _keeper) {
        if (_usdc == address(0) || _keeper == address(0)) revert ZeroAddress();
        usdc = IERC20(_usdc);
        owner = msg.sender;
        keeper = _keeper;
        emit OwnershipTransferred(address(0), msg.sender);
        emit KeeperUpdated(_keeper);
    }

    // ---- admin -----------------------------------------------------------

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setKeeper(address newKeeper) external onlyOwner {
        if (newKeeper == address(0)) revert ZeroAddress();
        keeper = newKeeper;
        emit KeeperUpdated(newKeeper);
    }

    function setTeller(address newTeller) external onlyOwner {
        // newTeller may be address(0) to disable USYC routing.
        teller = IUSYCTeller(newTeller);
        emit TellerUpdated(newTeller);
    }

    function advanceSeason() external onlyOwner {
        emit SeasonAdvanced(currentSeasonId, currentSeasonId + 1);
        currentSeasonId += 1;
    }

    // ---- commitment lifecycle -------------------------------------------

    /// @dev The keeper has already pulled USDC into this contract via the ERC-8183
    ///      escrow path. This call only books accounting + (optionally) routes to USYC.
    function recordDeposit(bytes32 commitmentId, address staker, uint256 principal)
        external
        onlyKeeper
    {
        if (staker == address(0)) revert ZeroAddress();
        if (principal == 0) revert ZeroAmount();
        if (commitments[commitmentId].recordedAt != 0) revert AlreadyRecorded();
        commitments[commitmentId] = Commitment({
            staker: staker,
            principal: principal,
            recordedAt: uint64(block.timestamp),
            outcome: Outcome.None
        });
        totalPooled += principal;
        emit DepositRecorded(commitmentId, staker, principal);

        if (address(teller) != address(0)) {
            usdc.approve(address(teller), principal);
            teller.deposit(principal);
        }
    }

    function settleCompleted(bytes32 commitmentId) external onlyKeeper {
        Commitment storage c = commitments[commitmentId];
        if (c.recordedAt == 0) revert UnknownCommitment();
        if (c.outcome != Outcome.None) revert AlreadySettled();
        c.outcome = Outcome.Completed;
        totalSettledSuccess += c.principal;
        totalPooled -= c.principal;
        emit Settled(commitmentId, Outcome.Completed);
        _payout(commitmentId, c.staker, c.principal);
    }

    function settleFailed(bytes32 commitmentId) external onlyKeeper {
        Commitment storage c = commitments[commitmentId];
        if (c.recordedAt == 0) revert UnknownCommitment();
        if (c.outcome != Outcome.None) revert AlreadySettled();
        c.outcome = Outcome.Failed;
        totalSettledFailed += c.principal;
        totalPooled -= c.principal;
        emit Settled(commitmentId, Outcome.Failed);
        // Funds stay in vault — distributed to completers via distributeToWinner.
    }

    /// @dev Owner-defined distribution. Keeps the contract dumb: payout math is
    ///      executed off-chain (proportional to completed commitments in the
    ///      season) and posted here once per recipient.
    function distributeToWinner(bytes32 commitmentId, address recipient, uint256 amount)
        external
        onlyOwner
    {
        if (recipient == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        totalDistributed += amount;
        emit Distributed(commitmentId, recipient, amount);
        _payout(commitmentId, recipient, amount);
    }

    function _payout(bytes32 commitmentId, address to, uint256 amount) internal {
        if (address(teller) != address(0)) {
            teller.redeem(amount);
        }
        usdc.transfer(to, amount);
        // commitmentId emitted in the caller event chain; silenced here.
        commitmentId;
    }

    // ---- views -----------------------------------------------------------

    function commitmentOutcome(bytes32 commitmentId) external view returns (Outcome) {
        return commitments[commitmentId].outcome;
    }
}
