import type { ElementNode } from "@openuidev/lang-core";
import { useOpenUI } from "./context";
import { ElementErrorBoundary } from "./element-error-boundary";
import { ElementPathContext, useElementPath } from "./element-type-context";
import { UnknownComponent } from "./unknown-component";

export interface RenderNodeProps {
  node: ElementNode;
}

/** Looks the element up in the library and renders it inside an error boundary. */
export function RenderNode({ node }: RenderNodeProps) {
  const context = useOpenUI();
  const parentPath = useElementPath();
  const definition = context.library.components[node.typeName];
  if (definition === undefined) return <UnknownComponent typeName={node.typeName} />;
  const Renderer = definition.component;
  return (
    <ElementErrorBoundary componentName={node.typeName} onError={context.reportError}>
      <ElementPathContext.Provider value={parentPath.concat(node.typeName)}>
        <Renderer
          props={node.props}
          renderNode={context.renderNode}
          statementId={node.statementId}
        />
      </ElementPathContext.Provider>
    </ElementErrorBoundary>
  );
}
