import LineChart from "./LineChart";
import type { WidgetData } from "../../types/dataAgent.types";

// Same time-series logic as LineChart — an area chart is just its filled variant.
export default function AreaChart({ data }: { data: WidgetData }) {
  return <LineChart data={data} area />;
}
