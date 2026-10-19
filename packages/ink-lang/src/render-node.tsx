import type { ElementNode } from "@openuidev/lang-core";
import { useOpenUI } from "./context";
import { ElementErrorBoundary } from "./element-error-boundary";
import { ElementPathContext, useElementPath } from "./element-type-context";
import { SequencePathContext, useSequencePath } from "./focus/sequence-path";
import { createSequencedRenderer } from "./focus/sequenced-render";
import { UnknownComponent } from "./unknown-component";

export interface RenderNodeProps {
  node: ElementNode;
  /** Where the element sits among the children its parent renders. */
  order: number;
}

/**
 * Looks the element up in the library and renders it inside an error boundary,
 * extending the element path with its type and the sequence path with its order.
 */
export function RenderNode({ node, order }: RenderNodeProps) {
  const context = useOpenUI();
  const parentPath = useElementPath();
  const parentSequence = useSequencePath();
  const definition = context.library.components[node.typeName];
  if (definition === undefined) return <UnknownComponent typeName={node.typeName} />;
  const Renderer = definition.component;
  // A fresh renderer each render: the counter must restart at 0 every time.
  const renderChild = createSequencedRenderer();
  return (
    <ElementErrorBoundary componentName={node.typeName} onError={context.reportError}>
      <ElementPathContext.Provider value={parentPath.concat(node.typeName)}>
        <SequencePathContext.Provider value={parentSequence.concat(order)}>
          <Renderer props={node.props} renderNode={renderChild} statementId={node.statementId} />
        </SequencePathContext.Provider>
      </ElementPathContext.Provider>
    </ElementErrorBoundary>
  );
}
