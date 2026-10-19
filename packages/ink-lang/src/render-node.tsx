import type { ElementNode } from "@openuidev/lang-core";
import { ComponentHost } from "./component-host";
import { useOpenUI } from "./context";
import { ElementErrorBoundary } from "./element-error-boundary";
import { ElementPathContext, useElementPath } from "./element-type-context";
import { SequencePathContext, useSequencePath } from "./focus/sequence-path";
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
  return (
    <ElementErrorBoundary componentName={node.typeName} onError={context.reportError}>
      <ElementPathContext.Provider value={parentPath.concat(node.typeName)}>
        <SequencePathContext.Provider value={parentSequence.concat(order)}>
          <ComponentHost
            key={node.typeName}
            renderer={definition.component}
            props={node.props}
            statementId={node.statementId}
          />
        </SequencePathContext.Provider>
      </ElementPathContext.Provider>
    </ElementErrorBoundary>
  );
}
