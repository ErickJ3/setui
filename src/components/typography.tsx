import { ReactNode, HTMLAttributes } from "react";

type TypographyProps = {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLElement>;

const Typograph = {
  H1: ({ children, className = "", ...props }: TypographyProps) => (
    <h1
      className={`scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl ${className}`}
      {...props}
    >
      {children}
    </h1>
  ),

  H2: ({ children, className = "", ...props }: TypographyProps) => (
    <h2
      className={`scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0 ${className}`}
      {...props}
    >
      {children}
    </h2>
  ),

  H3: ({ children, className = "", ...props }: TypographyProps) => (
    <h3
      className={`scroll-m-20 text-2xl font-semibold tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  ),

  H4: ({ children, className = "", ...props }: TypographyProps) => (
    <h4
      className={`scroll-m-20 text-xl font-semibold tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h4>
  ),

  P: ({ children, className = "", ...props }: TypographyProps) => (
    <p
      className={`leading-7 [&:not(:first-child)]:mt-6 ${className}`}
      {...props}
    >
      {children}
    </p>
  ),

  Blockquote: ({ children, className = "", ...props }: TypographyProps) => (
    <blockquote
      className={`mt-6 border-l-2 pl-6 italic ${className}`}
      {...props}
    >
      {children}
    </blockquote>
  ),

  Table: ({ children, className = "", ...props }: TypographyProps) => (
    <div className={`my-6 w-full overflow-y-auto ${className}`} {...props}>
      {children}
    </div>
  ),

  List: ({ children, className = "", ...props }: TypographyProps) => (
    <ul className={`my-6 ml-6 list-disc [&>li]:mt-2 ${className}`} {...props}>
      {children}
    </ul>
  ),

  InlineCode: ({ children, className = "", ...props }: TypographyProps) => (
    <code
      className={`relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold ${className}`}
      {...props}
    >
      {children}
    </code>
  ),

  Lead: ({ children, className = "", ...props }: TypographyProps) => (
    <p className={`text-xl text-muted-foreground ${className}`} {...props}>
      {children}
    </p>
  ),

  Large: ({ children, className = "", ...props }: TypographyProps) => (
    <div className={`text-lg font-semibold ${className}`} {...props}>
      {children}
    </div>
  ),

  Small: ({ children, className = "", ...props }: TypographyProps) => (
    <small
      className={`text-sm font-medium leading-none ${className}`}
      {...props}
    >
      {children}
    </small>
  ),

  Muted: ({ children, className = "", ...props }: TypographyProps) => (
    <p className={`text-sm text-muted-foreground ${className}`} {...props}>
      {children}
    </p>
  ),
};

export default Typograph;
