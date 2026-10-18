/** Stack directions and gaps, the three Card variants, Separator, Label and the image placeholders. */
export const layoutProgram = [
  "root = Stack([header, row, Separator(), sunk, clear, images])",
  'header = CardHeader("Layout", "Stack, Card, Separator, Label and images")',
  'row = Stack([left, right], "row", "l")',
  'left = Card([CardHeader("Card", "the default variant"), TextContent("A bordered card in a row stack.")], "card")',
  'right = Card([CardHeader("Sunk", "a dim border"), TextContent("Sits beside the first card with a large gap.")], "sunk")',
  'sunk = Card([labelled, TextContent("Cards take any content component; labels sit in a Stack.", "small")], "sunk", "column", "s")',
  'labelled = Stack([Label("A Label inside a sunk card")])',
  'clear = Card([TextContent("A clear card has no border at all.", "small-heavy")], "clear")',
  'images = Stack([diagram, photo, gallery], "column", "s")',
  'diagram = Image("Architecture diagram", "https://example.com/diagram.png")',
  'photo = ImageBlock("https://example.com/photo.png", "Team photo")',
  'gallery = ImageGallery([{src: "https://example.com/1.png", alt: "Before", details: "Last week"}, {src: "https://example.com/2.png", alt: "After", details: "Today"}])',
].join("\n");
