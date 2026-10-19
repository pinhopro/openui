import { Accordion } from "./components/accordion";
import { AccordionItem } from "./components/accordion-item";
import { AreaChart } from "./components/area-chart";
import { BarChart } from "./components/bar-chart";
import { BoldText } from "./components/bold-text";
import { Button } from "./components/button";
import { Buttons } from "./components/buttons";
import { Callout } from "./components/callout";
import { Card } from "./components/card";
import { CardHeader } from "./components/card-header";
import { Carousel } from "./components/carousel";
import { CheckBoxGroup } from "./components/check-box-group";
import { CheckBoxItem } from "./components/check-box-item";
import { ChipItem } from "./components/chip-item";
import { Chips } from "./components/chips";
import { CodeBlock } from "./components/code-block";
import { Col } from "./components/col";
import { Combobox } from "./components/combobox";
import { CompositeCardBlock } from "./components/composite-card-block";
import { CompositeCardItem } from "./components/composite-card-item";
import { ContextCardBlock } from "./components/context-card-block";
import { ContextCardItem } from "./components/context-card-item";
import { DatePicker } from "./components/date-picker";
import { Dialog } from "./components/dialog";
import { EditableTable } from "./components/editable-table";
import { EntityList } from "./components/entity-list";
import { Form } from "./components/form";
import { FormControl } from "./components/form-control";
import { HorizontalBarChart } from "./components/horizontal-bar-chart";
import { Icon } from "./components/icon";
import { IconButton } from "./components/icon-button";
import { IconText } from "./components/icon-text";
import { Image } from "./components/image";
import { ImageBlock } from "./components/image-block";
import { ImageGallery } from "./components/image-gallery";
import { ImageText } from "./components/image-text";
import { ImageTextLarge } from "./components/image-text-large";
import { InlineHeader } from "./components/inline-header";
import { Label } from "./components/label";
import { LineChart } from "./components/line-chart";
import { ListBlock } from "./components/list-block";
import { ListItem } from "./components/list-item";
import { MarkDownRenderer } from "./components/mark-down-renderer";
import { MetricIndicatorInline } from "./components/metric-indicator-inline";
import { MetricIndicatorWithStrikethrough } from "./components/metric-indicator-with-strikethrough";
import { Modal } from "./components/modal";
import { ModalDialog } from "./components/modal-dialog";
import { OptionCard } from "./components/option-card";
import { OptionCards } from "./components/option-cards";
import { OverviewCardBlock } from "./components/overview-card-block";
import { OverviewCardItem } from "./components/overview-card-item";
import { PieChart } from "./components/pie-chart";
import { Point } from "./components/point";
import { QrCode } from "./components/qr-code";
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
import { SnippetCardBlock } from "./components/snippet-card-block";
import { SnippetCardItem } from "./components/snippet-card-item";
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
import { Text } from "./components/text";
import { TextArea } from "./components/text-area";
import { TextCallout } from "./components/text-callout";
import { TextContent } from "./components/text-content";
import { Input } from "./components/text-input";
import { Theme } from "./components/theme";
import { Tooltip } from "./components/tooltip";
import { VisualCardBlock } from "./components/visual-card-block";
import { VisualCardItem } from "./components/visual-card-item";
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
      "Modal",
    ],
    notes: [
      '- For grid-like layouts, use Stack with direction "row" and wrap set to true.',
      "- Use nested Stacks when you need explicit rows/sections.",
      "- Give each TabItem a unique value; the trigger is the label shown in the tab strip.",
      "- Carousel shows one item at a time; Left and Right move between items.",
      '- Modal: Modal("Title", $showModal, [content]) - $showModal is boolean, the [ x ] button closes it. Put Form with its own buttons inside children.',
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
      "Combobox",
      "SelectItem",
      "DatePicker",
      "Slider",
      "CheckBoxGroup",
      "CheckBoxItem",
      "RadioGroup",
      "RadioItem",
      "SwitchGroup",
      "SwitchItem",
      "Chips",
      "ChipItem",
      "OptionCards",
      "OptionCard",
    ],
    notes: [
      "- Chips: compact single/multiple selection pills. Use ChipItem references for each option.",
      "- OptionCards: larger selectable cards with title, subtitle and an optional Icon or Image on top. Use OptionCard references for each option.",
      "- Define EACH FormControl as its own reference - do NOT inline all controls in one array.",
      "- NEVER nest Form inside Form.",
      "- Form requires explicit buttons. Always pass a Buttons(...) reference as the second Form argument: Form(name, buttons, fields).",
      "- Select takes SelectItem(value, label) options; bind its value with a $variable to read it elsewhere.",
      "- rules is an optional object: {required: true, email: true, minLength: 8, maxLength: 100}",
      "- Available rules: required, email, min, max, minLength, maxLength, pattern, url, numeric",
      "- The renderer shows error messages automatically - do NOT generate error text in the UI",
      '- DatePicker stores an ISO "YYYY-MM-DD" string (or { from, to } in range mode); Slider stores [value].',
      "- Combobox takes the same arguments as Select and lets the user type to filter long option lists.",
    ],
  },
  {
    name: "Buttons",
    components: ["Button", "Buttons", "IconButton"],
    notes: [
      "- IconButton shows its icon name and its name as a button; the name is also the action label.",
    ],
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
  {
    name: "Cards",
    components: [
      "SnippetCardBlock",
      "SnippetCardItem",
      "OverviewCardBlock",
      "OverviewCardItem",
      "ContextCardBlock",
      "ContextCardItem",
      "CompositeCardBlock",
      "CompositeCardItem",
      "VisualCardBlock",
      "VisualCardItem",
      "Text",
      "BoldText",
      "IconText",
      "ImageText",
      "ImageTextLarge",
      "MetricIndicatorInline",
      "MetricIndicatorWithStrikethrough",
    ],
    notes: [
      "- Card blocks stack their items as bordered text blocks. Every item in a block must have the same structure.",
      "- SnippetCardItem: small card with lhs (IconText | ImageText) and optional rhs (Text | BoldText) - good for key/value facts.",
      "- OverviewCardItem: small card with top (IconText | ImageText | Text) and optional bottom MetricIndicatorInline - good for KPIs.",
      "- ContextCardItem: medium card with a title (string or Tag), body text and optional background image - good for summaries.",
      "- CompositeCardItem: rich card with header, body array (Text, BoldText, MetricIndicatorInline, IconText, Image, charts, ListBlock, TagBlock, EntityList) and footer (price + Button) - good for products/offers.",
      "- VisualCardItem: image-first card with a BoldText body and optional Tag.",
      "- Text / BoldText / IconText / ImageText / ImageTextLarge / MetricIndicator* are the inline building blocks used INSIDE card items; do not place them directly in the root Card.",
    ],
  },
  {
    name: "Terminal extras",
    components: ["Theme", "Tooltip", "QrCode", "ModalDialog", "Dialog"],
    notes: [
      '- Theme(tokens, css, children) applies a design system to its children: tokens like {"color.primary": "#2563eb", "shape.fieldBorder": "round", mode: "dark"} and a stylesheet of the CSS subset.',
      "- Tooltip(trigger, text, placement?, variant?) shows text beside its trigger while focused or hovered.",
      "- QrCode(data, size?) draws a scannable QR code with block characters.",
      "- ModalDialog(variant, title, body, cancelLabel?, confirmLabel?, open?, confirmAction?, cancelAction?, draggable?) blocks everything behind it; use a $boolean binding as open and a Button with @Set($open, true) to show it.",
      "- Dialog(variant, title, body, cancelLabel?, confirmLabel?, open?, confirmAction?, cancelAction?, placement?, draggable?) floats beside its declaration without blocking the page.",
      "- Both dialogs (and Modal) move by dragging their title bar or with Ctrl+arrows; pass draggable false to keep a dialog where it is placed.",
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
    Theme,
    Tooltip,
    QrCode,
    ModalDialog,
    Dialog,
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
    Combobox,
    SelectItem,
    DatePicker,
    Slider,
    CheckBoxGroup,
    CheckBoxItem,
    RadioGroup,
    RadioItem,
    SwitchGroup,
    SwitchItem,
    ChipItem,
    Chips,
    OptionCard,
    OptionCards,
    Button,
    Buttons,
    IconButton,
    Text,
    BoldText,
    IconText,
    ImageText,
    ImageTextLarge,
    MetricIndicatorInline,
    MetricIndicatorWithStrikethrough,
    SnippetCardItem,
    SnippetCardBlock,
    OverviewCardItem,
    OverviewCardBlock,
    ContextCardItem,
    ContextCardBlock,
    CompositeCardItem,
    CompositeCardBlock,
    VisualCardItem,
    VisualCardBlock,
    Modal,
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
