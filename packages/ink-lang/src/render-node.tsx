import type { ElementNode } from "@openuidev/lang-core";
import { useOpenUI } from "./context";
import { ElementErrorBoundary } from "./element-error-boundary";
import { ElementTypeContext } from "./element-type-context";
import { UnknownComponent } from "./unknown-component";

export interface RenderNodeProps {
  node: ElementNode;
}

/** Looks the element up in the library and renders it inside an error boundary. */
export function RenderNode({ node }: RenderNodeProps) {
  const context = useOpenUI();
  const definition = context.library.components[node.typeName];
  if (definition === undefined) return <UnknownComponent typeName={node.typeName} />;
  const Renderer = definition.component;
  return (
    <ElementErrorBoundary componentName={node.typeName} onError={context.reportError}>
      <ElementTypeContext.Provider value={node.typeName}>
        <Renderer
          props={node.props}
          renderNode={context.renderNode}
          statementId={node.statementId}
        />
      </ElementTypeContext.Provider>
    </ElementErrorBoundary>
  );
}
