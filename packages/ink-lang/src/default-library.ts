import { AreaChart } from "./components/area-chart";
import { BarChart } from "./components/bar-chart";
import { Button } from "./components/button";
import { Buttons } from "./components/buttons";
import { Card } from "./components/card";
import { CardHeader } from "./components/card-header";
import { Col } from "./components/col";
import { Form } from "./components/form";
import { FormControl } from "./components/form-control";
import { HorizontalBarChart } from "./components/horizontal-bar-chart";
import { Label } from "./components/label";
import { LineChart } from "./components/line-chart";
import { PieChart } from "./components/pie-chart";
import { Point } from "./components/point";
import { RadarChart } from "./components/radar-chart";
import { RadialChart } from "./components/radial-chart";
import { ScatterChart } from "./components/scatter-chart";
import { ScatterSeries } from "./components/scatter-series";
import { Select } from "./components/select";
import { SelectItem } from "./components/select-item";
import { Series } from "./components/series";
import { SingleStackedBarChart } from "./components/single-stacked-bar-chart";
import { Slice } from "./components/slice";
import { Stack } from "./components/stack";
import { TabItem } from "./components/tab-item";
import { Table } from "./components/table";
import { Tabs } from "./components/tabs";
import { TextContent } from "./components/text-content";
import { Input } from "./components/text-input";
import { createLibrary, type ComponentGroup, type Library } from "./library";

/** Prompt sections for the terminal library; the notes mirror the React default library. */
export const inkComponentGroups: ComponentGroup[] = [
  {
    name: "Layout",
    components: ["Stack"],
    notes: [
      '- For grid-like layouts, use Stack with direction "row" and wrap set to true.',
      "- Use nested Stacks when you need explicit rows/sections.",
    ],
  },
  {
    name: "Content",
    components: ["Card", "CardHeader", "TextContent"],
    notes: [
      '- Use Cards to group related sections. Stack with direction "row" for side-by-side layouts.',
      "- Give a Card a title with a CardHeader as its first child.",
    ],
  },
  {
    name: "Navigation",
    components: ["Tabs", "TabItem"],
    notes: ["- Give each TabItem a unique value; the trigger is the label shown in the tab strip."],
  },
  {
    name: "Data",
    components: ["Table", "Col"],
    notes: [
      "- Table is column-oriented: one Col per column, each with its own data array (one value per row).",
      '- Mark numeric columns with type "number" so they are right-aligned.',
    ],
  },
  {
    name: "Charts (2D)",
    components: [
      "BarChart",
      "LineChart",
      "AreaChart",
      "RadarChart",
      "HorizontalBarChart",
      "Series",
    ],
    notes: [
      '- Charts accept column arrays: LineChart(labels, [Series("Name", values)]). Use array pluck: LineChart(data.rows.day, [Series("Views", data.rows.views)])',
      "- Use Cards to wrap charts with CardHeader for titled sections",
      "- Chart + Table from same source: use @Sort or @Filter result for both LineChart and Table Col data",
    ],
  },
  {
    name: "Charts (1D)",
    components: ["PieChart", "RadialChart", "SingleStackedBarChart", "Slice"],
    notes: [
      "- PieChart and BarChart need NUMBERS, not objects. For list data, use @Count(@Filter(...)) to aggregate:",
      '- PieChart from list: `PieChart(["Low", "Med", "High"], [@Count(@Filter(data.rows, "priority", "==", "low")), @Count(@Filter(data.rows, "priority", "==", "medium")), @Count(@Filter(data.rows, "priority", "==", "high"))], "donut")`',
    ],
  },
  {
    name: "Charts (Scatter)",
    components: ["ScatterChart", "ScatterSeries", "Point"],
  },
  {
    name: "Forms",
    components: ["Form", "FormControl", "Label", "Input", "Select", "SelectItem"],
    notes: [
      "- Define EACH FormControl as its own reference - do NOT inline all controls in one array.",
      "- NEVER nest Form inside Form.",
      "- Form requires explicit buttons. Always pass a Buttons(...) reference as the second Form argument: Form(name, buttons, fields).",
      "- Select takes SelectItem(value, label) options; bind its value with a $variable to read it elsewhere.",
    ],
  },
  {
    name: "Buttons",
    components: ["Button", "Buttons"],
  },
];

/**
 * The terminal counterpart of react-ui's `openuiLibrary`: the same component
 * names, positional arguments and schemas for every component it ships, so a
 * program written for the React renderer renders here unchanged.
 */
export const inkLibrary: Library = createLibrary({
  root: "Stack",
  componentGroups: inkComponentGroups,
  components: [
    Stack,
    Card,
    CardHeader,
    TextContent,
    Table,
    Col,
    Tabs,
    TabItem,
    Form,
    FormControl,
    Label,
    Input,
    Select,
    SelectItem,
    Button,
    Buttons,
    BarChart,
    LineChart,
    AreaChart,
    RadarChart,
    HorizontalBarChart,
    Series,
    PieChart,
    RadialChart,
    SingleStackedBarChart,
    Slice,
    ScatterChart,
    ScatterSeries,
    Point,
  ],
});
