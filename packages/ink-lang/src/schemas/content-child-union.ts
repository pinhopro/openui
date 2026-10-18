import { z } from "zod/v4";
import { AreaChart } from "../components/area-chart";
import { BarChart } from "../components/bar-chart";
import { Buttons } from "../components/buttons";
import { Callout } from "../components/callout";
import { CardHeader } from "../components/card-header";
import { CodeBlock } from "../components/code-block";
import { EditableTable } from "../components/editable-table";
import { EntityList } from "../components/entity-list";
import { Form } from "../components/form";
import { HorizontalBarChart } from "../components/horizontal-bar-chart";
import { Image } from "../components/image";
import { ImageBlock } from "../components/image-block";
import { ImageGallery } from "../components/image-gallery";
import { InlineHeader } from "../components/inline-header";
import { LineChart } from "../components/line-chart";
import { MarkDownRenderer } from "../components/mark-down-renderer";
import { PieChart } from "../components/pie-chart";
import { RadarChart } from "../components/radar-chart";
import { RadialChart } from "../components/radial-chart";
import { ScatterChart } from "../components/scatter-chart";
import { Separator } from "../components/separator";
import { SingleStackedBarChart } from "../components/single-stacked-bar-chart";
import { Steps } from "../components/steps";
import { Table } from "../components/table";
import { TagBlock } from "../components/tag-block";
import { TextCallout } from "../components/text-callout";
import { TextContent } from "../components/text-content";

// Copy of ContentChildUnion in packages/react-ui/src/genui-lib/unions.ts, in the same
// order, reduced to the components this library ships. Card.children, TabItem.content,
// AccordionItem.content and Carousel.children are built from it like in react-ui.
export const ContentChildUnion = z.union([
  TextContent.ref,
  MarkDownRenderer.ref,
  CardHeader.ref,
  Callout.ref,
  TextCallout.ref,
  CodeBlock.ref,
  Image.ref,
  ImageBlock.ref,
  ImageGallery.ref,
  Separator.ref,
  HorizontalBarChart.ref,
  RadarChart.ref,
  PieChart.ref,
  RadialChart.ref,
  SingleStackedBarChart.ref,
  ScatterChart.ref,
  AreaChart.ref,
  BarChart.ref,
  LineChart.ref,
  Table.ref,
  TagBlock.ref,
  Form.ref,
  Buttons.ref,
  Steps.ref,
  InlineHeader.ref,
  EntityList.ref,
  EditableTable.ref,
]);
