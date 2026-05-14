interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className = "" }: ContainerProps) {
  return (
    <div className={`mx-auto w-[min(1180px,calc(100%-40px))] ${className}`}>
      {children}
    </div>
  );
}
