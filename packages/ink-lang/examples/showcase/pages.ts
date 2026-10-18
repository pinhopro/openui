import { cardsProgram } from "./programs/cards";
import { chartsProgram } from "./programs/charts";
import { contentProgram } from "./programs/content";
import { dataProgram } from "./programs/data";
import { feedbackProgram } from "./programs/feedback";
import { formsProgram } from "./programs/forms";
import { layoutProgram } from "./programs/layout";
import { navigationProgram } from "./programs/navigation";
import { overviewProgram } from "./programs/overview";
import { selectionProgram } from "./programs/selection";

/** One entry of the showcase sidebar: an OpenUI Lang program the main pane streams in. */
export interface ShowcasePage {
  id: string;
  /** The sidebar label; also the title of the page's CardHeader. */
  title: string;
  program: string;
}

export const showcasePages: ShowcasePage[] = [
  {
    id: "overview",
    title: "Overview",
    program: overviewProgram,
  },
  {
    id: "layout",
    title: "Layout",
    program: layoutProgram,
  },
  {
    id: "content",
    title: "Content",
    program: contentProgram,
  },
  {
    id: "charts",
    title: "Charts",
    program: chartsProgram,
  },
  {
    id: "forms",
    title: "Forms",
    program: formsProgram,
  },
  {
    id: "selection",
    title: "Selection",
    program: selectionProgram,
  },
  {
    id: "data",
    title: "Data",
    program: dataProgram,
  },
  {
    id: "navigation",
    title: "Navigation",
    program: navigationProgram,
  },
  {
    id: "cards",
    title: "Card blocks",
    program: cardsProgram,
  },
  {
    id: "feedback",
    title: "Feedback",
    program: feedbackProgram,
  },
];
