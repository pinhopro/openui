/** Chips and option cards, single and multiple, with icons and a disabled option. */
export const selectionProgram = [
  "root = Stack([header, chips, cards])",
  'header = CardHeader("Selection", "Chips and option cards")',
  'chips = Stack([InlineHeader("Chips", "single, then multiple"), size, toppings], "column", "xs")',
  'size = Chips("size", "single", [ChipItem("s", "Small"), ChipItem("m", "Medium", Icon("star")), ChipItem("l", "Large"), ChipItem("xl", "Extra large", null, true)], null, "m")',
  'toppings = Chips("toppings", "multiple", [ChipItem("cheese", "Cheese"), ChipItem("olives", "Olives"), ChipItem("basil", "Basil")], null, ["cheese", "basil"])',
  'cards = Stack([InlineHeader("OptionCards", "single, then multiple"), tier, addons], "column", "xs")',
  'tier = OptionCards("tier", "single", [starter, growth, enterprise], null, "growth")',
  'starter = OptionCard("starter", "Starter", "For side projects", Icon("leaf"))',
  'growth = OptionCard("growth", "Growth", "For small teams", Icon("trending-up"))',
  'enterprise = OptionCard("enterprise", "Enterprise", "Talk to sales", Icon("building"), true)',
  'addons = OptionCards("addons", "multiple", [OptionCard("backup", "Backups", "Nightly snapshots"), OptionCard("sso", "SSO", "SAML and OIDC")])',
].join("\n");
