import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

interface Props {
  rows: Record<string, any>[];
  keys: string[];
  headers: string[];
  orientation: "landscape" | "portrait";
}

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 8, fontFamily: "Helvetica" },
  title: { fontSize: 13, fontWeight: "bold", marginBottom: 10, color: "#ED1C24" },
  meta: { fontSize: 7, color: "#888", marginBottom: 10 },
  table: { display: "flex", flexDirection: "column", borderRadius: 4, overflow: "hidden" },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#ED1C24",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  headerCell: { color: "#fff", fontWeight: "bold", flex: 1, fontSize: 7 },
  row: { flexDirection: "row", paddingVertical: 4, paddingHorizontal: 4, borderBottomWidth: 0.5, borderColor: "#eee" },
  rowOdd: { backgroundColor: "#f9f9f9" },
  cell: { flex: 1, color: "#333", fontSize: 7 },
});

export const EmployeeExportDoc = ({ rows, keys, headers, orientation }: Props) => (
  <Document>
    <Page
      orientation={orientation}
      size="A4"
      style={styles.page}
    >
      <Text style={styles.title}>Employee Report</Text>
      <Text style={styles.meta}>
        Generated: {new Date().toLocaleString()} · {rows.length} records
      </Text>
      <View style={styles.table}>
        <View style={styles.headerRow}>
          {headers.map((h) => (
            <Text key={h} style={styles.headerCell}>{h}</Text>
          ))}
        </View>
        {rows.map((row, i) => (
          <View key={i} style={[styles.row, i % 2 !== 0 ? styles.rowOdd : {}]}>
            {keys.map((k) => (
              <Text key={k} style={styles.cell}>{row[k] ?? "—"}</Text>
            ))}
          </View>
        ))}
      </View>
    </Page>
  </Document>
);