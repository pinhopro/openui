import { Accordion } from "./components/accordion";
import { AccordionItem } from "./components/accordion-item";
import { AreaChart } from "./components/area-chart";
import { BarChart } from "./components/bar-chart";
import { Button } from "./components/button";
import { Buttons } from "./components/buttons";
import { Callout } from "./components/callout";
import { Card } from "./components/card";
import { CardHeader } from "./components/card-header";
import { Carousel } from "./components/carousel";
import { CheckBoxGroup } from "./components/check-box-group";
import { CheckBoxItem } from "./components/check-box-item";
import { CodeBlock } from "./components/code-block";
import { Col } from "./components/col";
import { DatePicker } from "./components/date-picker";
import { EditableTable } from "./components/editable-table";
import { EntityList } from "./components/entity-list";
import { Form } from "./components/form";
import { FormControl } from "./components/form-control";
import { HorizontalBarChart } from "./components/horizontal-bar-chart";
import { Icon } from "./components/icon";
import { Image } from "./components/image";
import { ImageBlock } from "./components/image-block";
import { ImageGallery } from "./components/image-gallery";
import { InlineHeader } from "./components/inline-header";
import { Label } from "./components/label";
import { LineChart } from "./components/line-chart";
import { ListBlock } from "./components/list-block";
import { ListItem } from "./components/list-item";
import { MarkDownRenderer } from "./components/mark-down-renderer";
import { PieChart } from "./components/pie-chart";
import { Point } from "./components/point";
import { RadarChart } from "./components/radar-chart";
import { RadialChart } from "./components/radial-chart";
import { RadioGroup } from "./components/radio-group";
import { RadioItem } from "./components/radio-item";
import { ScatterChart } from "./components/scatter-chart";
import { ScatterSeries } from "./components/scatter-series";
import { Select } from "./components/select";
import { SelectItem } from "./components/select-item";
import { Separator } from "./components/separator";
import { Series } from "./components/series";
import { SingleStackedBarChart } from "./components/single-stacked-bar-chart";
import { Slice } from "./components/slice";
import { Slider } from "./components/slider";
import { Stack } from "./components/stack";
import { Steps } from "./components/steps";
import { StepsItem } from "./components/steps-item";
import { SwitchGroup } from "./components/switch-group";
import { SwitchItem } from "./components/switch-item";
import { TabItem } from "./components/tab-item";
import { Table } from "./components/table";
import { Tabs } from "./components/tabs";
import { Tag } from "./components/tag";
import { TagBlock } from "./components/tag-block";
import { TextArea } from "./components/text-area";
import { TextCallout } from "./components/text-callout";
import { TextContent } from "./components/text-content";
import { Input } from "./components/text-input";
import { createLibrary, type ComponentGroup, type Library } from "./library";

/** Prompt sections for the terminal library; the notes mirror the React default library. */
export const inkComponentGroups: ComponentGroup[] = [
  {
    name: "Layout",
    components: [
      "Stack",
      "Tabs",
      "TabItem",
      "Accordion",
      "AccordionItem",
      "Steps",
      "StepsItem",
      "Carousel",
      "Separator",
    ],
    notes: [
      '- For grid-like layouts, use Stack with direction "row" and wrap set to true.',
      "- Use nested Stacks when you need explicit rows/sections.",
      "- Give each TabItem a unique value; the trigger is the label shown in the tab strip.",
      "- Carousel shows one item at a time; Left and Right move between items.",
    ],
  },
  {
    name: "Content",
    components: [
      "Card",
      "CardHeader",
      "TextContent",
      "MarkDownRenderer",
      "Callout",
      "TextCallout",
      "Image",
      "ImageBlock",
      "ImageGallery",
      "CodeBlock",
      "InlineHeader",
    ],
    notes: [
      '- Use Cards to group related sections. Stack with direction "row" for side-by-side layouts.',
      "- Give a Card a title with a CardHeader as its first child.",
      "- InlineHeader is a compact heading + description pair for labelling a block (lighter than CardHeader).",
      '- Success toast: Callout("success", "Saved", "Done.", $showSuccess) - use @Set($showSuccess, true) in the save action; it auto-dismisses after 3s.',
      "- Images are never fetched in the terminal: Image, ImageBlock and ImageGallery show the alt text (or the url) as a placeholder line.",
    ],
  },
  {
    name: "Tables",
    components: ["Table", "Col", "EditableTable"],
    notes: [
      "- Table is column-oriented: one Col per column, each with its own data array (one value per row).",
      '- Mark numeric columns with type "number" so they are right-aligned.',
      "- EditableTable lets the user edit cells inline. Give it a unique name, columns of { type, key, header } with type one of text | number | date-single | select | url (select also needs options: [{ value, label }]).",
      "- EditableTable data is an array of { id, values } rows where values are ordered positionally to match columns; the edited rows are stored under the table name.",
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
    components: [
      "Form",
      "FormControl",
      "Label",
      "Input",
      "TextArea",
      "Select",
      "SelectItem",
      "DatePicker",
      "Slider",
      "CheckBoxGroup",
      "CheckBoxItem",
      "RadioGroup",
      "RadioItem",
      "SwitchGroup",
      "SwitchItem",
    ],
    notes: [
      "- Define EACH FormControl as its own reference - do NOT inline all controls in one array.",
      "- NEVER nest Form inside Form.",
      "- Form requires explicit buttons. Always pass a Buttons(...) reference as the second Form argument: Form(name, buttons, fields).",
      "- Select takes SelectItem(value, label) options; bind its value with a $variable to read it elsewhere.",
      "- rules is an optional object: {required: true, email: true, minLength: 8, maxLength: 100}",
      "- Available rules: required, email, min, max, minLength, maxLength, pattern, url, numeric",
      "- The renderer shows error messages automatically - do NOT generate error text in the UI",
      '- DatePicker stores an ISO "YYYY-MM-DD" string (or { from, to } in range mode); Slider stores [value].',
    ],
  },
  {
    name: "Buttons",
    components: ["Button", "Buttons"],
  },
  {
    name: "Data Display",
    components: ["TagBlock", "Tag", "Icon", "EntityList", "ListBlock", "ListItem"],
    notes: [
      '- Color-mapped Tag: Tag(value, null, "sm", value == "high" ? "danger" : value == "medium" ? "warning" : "neutral")',
      "- EntityList is a compact two-column list of { left, right } rows (e.g. name / value). size='default' also supports a header and footer row; size='small' does not.",
      "- ListBlock is a numbered or image list of ListItem references. An action on ListItem is optional.",
      "- Icons have no glyphs in the terminal: an Icon shows as its name in angle brackets.",
    ],
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
    MarkDownRenderer,
    Callout,
    TextCallout,
    Image,
    ImageBlock,
    ImageGallery,
    CodeBlock,
    InlineHeader,
    Table,
    Col,
    EditableTable,
    Tabs,
    TabItem,
    Accordion,
    AccordionItem,
    Steps,
    StepsItem,
    Carousel,
    Separator,
    TagBlock,
    Tag,
    Icon,
    EntityList,
    ListBlock,
    ListItem,
    Form,
    FormControl,
    Label,
    Input,
    TextArea,
    Select,
    SelectItem,
    DatePicker,
    Slider,
    CheckBoxGroup,
    CheckBoxItem,
    RadioGroup,
    RadioItem,
    SwitchGroup,
    SwitchItem,
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
