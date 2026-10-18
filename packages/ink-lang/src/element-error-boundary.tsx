import type { OpenUIError } from "@openuidev/lang-core";
import { Component, type ReactNode } from "react";

export interface ElementErrorBoundaryProps {
  componentName: string;
  onError: (error: OpenUIError) => void;
  children: ReactNode;
}

interface ElementErrorBoundaryState {
  hasError: boolean;
}

/**
 * Keeps the last children that rendered successfully when the current ones
 * throw, so a streaming program never blanks the screen, and retries as soon
 * as new children arrive.
 */
export class ElementErrorBoundary extends Component<
  ElementErrorBoundaryProps,
  ElementErrorBoundaryState
> {
  private lastValidChildren: ReactNode = null;

  /** The children already reported; the retry of the same children throws again. */
  private reportedChildren: ReactNode = null;

  constructor(props: ElementErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ElementErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidMount(): void {
    if (!this.state.hasError) {
      this.lastValidChildren = this.props.children;
    }
  }

  override componentDidUpdate(previousProps: ElementErrorBoundaryProps): void {
    if (!this.state.hasError) {
      this.lastValidChildren = this.props.children;
    }
    if (this.state.hasError && previousProps.children !== this.props.children) {
      this.setState({ hasError: false });
    }
  }

  override componentDidCatch(error: Error): void {
    if (this.props.children === this.reportedChildren) return;
    this.reportedChildren = this.props.children;
    const name = this.props.componentName;
    this.props.onError({
      source: "runtime",
      code: "render-error",
      component: name,
      message: `Component ${name} render failed: ${error.message}`,
    });
  }

  override render(): ReactNode {
    if (this.state.hasError) return this.lastValidChildren;
    return this.props.children;
  }
}
