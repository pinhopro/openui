/** A table long enough to page, an entity list, a list block with actions and an editable table. */
export const dataProgram = [
  "root = Stack([header, table, entities, releases, servers])",
  'header = CardHeader("Data", "Tables with paging, entity lists, list blocks and an editable table")',
  "table = Table([service, region, latency])",
  'service = Col("Service", ["api", "web", "auth", "billing", "search", "mail", "jobs", "cache", "cdn", "db", "logs", "metrics", "queue", "sync"])',
  'region = Col("Region", ["us-east-1", "eu-west-1", "ap-south-1", "us-east-1", "eu-west-1", "ap-south-1", "us-east-1", "eu-west-1", "ap-south-1", "us-east-1", "eu-west-1", "ap-south-1", "us-east-1", "eu-west-1"])',
  'latency = Col("p95 (ms)", [12, 88, 140, 33, 61, 19, 240, 7, 15, 52, 98, 44, 120, 73], "number")',
  'entities = EntityList([{left: "Requests", right: "1,204,331", rightVariant: "number"}, {left: "Errors", right: "0.02%", rightVariant: "number"}, {left: "Owner", right: "platform-team"}], "default", {left: "Metric", right: "Value"}, {left: "Updated", right: "just now"})',
  'releases = ListBlock([first, second, third], "number", "default")',
  'first = ListItem("Release 1.4", "Shipped braille charts", null, "Open", @ToAssistant("Open release 1.4"))',
  'second = ListItem("Release 1.3", "Added mouse support", {src: "https://example.com/1-3.png", alt: "1.3"}, "Open", @ToAssistant("Open release 1.3"))',
  'third = ListItem("Release 1.2", "Combobox and table paging")',
  'servers = EditableTable("servers", [{type: "text", key: "name", header: "Name"}, {type: "number", key: "cpus", header: "CPUs", width: 6}, {type: "select", key: "env", header: "Env", options: [{value: "prod", label: "Prod"}, {value: "stage", label: "Stage"}]}, {type: "date-single", key: "since", header: "Since"}, {type: "url", key: "url", header: "URL"}], [{id: "a", values: ["api-1", 4, "prod", "2024-01-15", "https://api.example.com"]}, {id: "b", values: ["web-1", 2, "stage", "2024-03-02", "https://web.example.com"]}])',
].join("\n");
