import BarChart from "./charts/BarChart";
import LineChart from "./charts/LineChart";
import PieChart from "./charts/PieChart";
import AreaChart from "./charts/AreaChart";
import MultiBarChart from "./charts/MultiBarChart";
import BarNegativeChart from "./charts/BarNegativeChart";
import DataTable from "./DataTable";
import MetricsGrid from "./MetricsGrid";
import TagList from "./TagList";
import type { ChartType, WidgetData } from "../types/dataAgent.types";

/** Maps a widget's chosen chart type to its rendering component — the single place new visualization types get registered. */
export function renderWidgetChart(type: ChartType, data: WidgetData) {
  switch (type) {
    case "bar":
      return <BarChart data={data} />;
    case "line":
      return <LineChart data={data} />;
    case "pie":
      return <PieChart data={data} />;
    case "area":
      return <AreaChart data={data} />;
    case "multibar":
      return <MultiBarChart data={data} />;
    case "barnegative":
      return <BarNegativeChart data={data} />;
    case "metrics":
      return <MetricsGrid data={data} />;
    case "tags":
      return <TagList data={data} />;
    case "table":
    default:
      return <DataTable data={data} />;
  }
}
