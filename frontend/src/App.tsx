import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SummaryResponse = {
  kpis: {
    failure_rate_percent: number;
    avg_torque: number;
    avg_tool_wear: number;
    high_risk_machines: number;
    rows: number;
  };
  failure_distribution: { label: string; value: number; key: number }[];
  risk_indicators: { metric: string; average: number }[];
};

type SampleResponse = {
  rows: Record<string, number>[];
};

type PredictResponse = {
  predicted_failure: boolean;
  failure_probability: number;
  message: string;
  recommendation: string;
};

type MachineType = "H" | "L" | "M";

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export default function App() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [sample, setSample] = useState<SampleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);

  const [airTemp, setAirTemp] = useState(300);
  const [processTemp, setProcessTemp] = useState(310);
  const [rotSpeed, setRotSpeed] = useState(1500);
  const [torque, setTorque] = useState(40);
  const [toolWear, setToolWear] = useState(100);
  const [machineType, setMachineType] = useState<MachineType>("H");

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, sampleRes] = await Promise.all([
        fetch(`${apiBase}/summary`),
        fetch(`${apiBase}/data/sample?limit=12`),
      ]);
      if (!summaryRes.ok || !sampleRes.ok) {
        throw new Error("API unavailable");
      }
      const summaryJson = (await summaryRes.json()) as SummaryResponse;
      const sampleJson = (await sampleRes.json()) as SampleResponse;
      setSummary(summaryJson);
      setSample(sampleJson);

      setAirTemp(Math.round(summaryJson.risk_indicators.find((x) => x.metric === "Air Temp")?.average ?? 300));
      setProcessTemp(Math.round(summaryJson.risk_indicators.find((x) => x.metric === "Process Temp")?.average ?? 310));
      setTorque(Math.round(summaryJson.kpis.avg_torque));
      setToolWear(Math.round(summaryJson.kpis.avg_tool_wear));
    } catch {
      setError("Could not connect to API. Start backend server at http://127.0.0.1:8000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboard();
  }, []);

  const onPredict = async () => {
    setPredicting(true);
    setPrediction(null);
    try {
      const res = await fetch(`${apiBase}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          air_temp: airTemp,
          process_temp: processTemp,
          rotational_speed: rotSpeed,
          torque,
          tool_wear: toolWear,
          machine_type: machineType,
        }),
      });
      if (!res.ok) {
        throw new Error("Prediction failed");
      }
      setPrediction((await res.json()) as PredictResponse);
    } catch {
      setError("Prediction request failed. Check API server logs.");
    } finally {
      setPredicting(false);
    }
  };

  const riskTone = useMemo(() => {
    if (!prediction) return "info";
    return prediction.predicted_failure ? "error" : "success";
  }, [prediction]);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{ alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between", mb: 3, gap: 1 }}
      >
        <Box>
          <Typography variant="h4">Smart Manufacturing Command Center</Typography>
          <Typography color="text.secondary">Predictive maintenance + operational analytics dashboard</Typography>
        </Box>
        <Button variant="outlined" onClick={fetchDashboard} disabled={loading}>
          Refresh Data
        </Button>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
          gap: 2,
          mb: 2,
        }}
      >
        {[
          { label: "Failure Rate", value: `${summary?.kpis.failure_rate_percent ?? "-"}%` },
          { label: "Average Torque", value: summary?.kpis.avg_torque ?? "-" },
          { label: "Average Tool Wear", value: summary?.kpis.avg_tool_wear ?? "-" },
          { label: "High-Risk Machines", value: summary?.kpis.high_risk_machines ?? "-" },
        ].map((kpi) => (
          <Box key={kpi.label}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  {kpi.label}
                </Typography>
                <Typography variant="h5">{kpi.value}</Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: 2 }}>
        <Box>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Machine Failure Distribution
              </Typography>
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary?.failure_distribution ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {(summary?.failure_distribution ?? []).map((d) => (
                        <Cell key={d.label} fill={d.key === 1 ? "#ef4444" : "#22c55e"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Operational Risk Indicators
              </Typography>
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary?.risk_indicators ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="average" fill="#4f8cff" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Predict Machine Health
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography gutterBottom>Air Temperature: {airTemp}</Typography>
                  <Slider value={airTemp} onChange={(_, v) => setAirTemp(v as number)} min={280} max={330} />
                </Box>
                <Box>
                  <Typography gutterBottom>Process Temperature: {processTemp}</Typography>
                  <Slider value={processTemp} onChange={(_, v) => setProcessTemp(v as number)} min={280} max={360} />
                </Box>
                <Box>
                  <Typography gutterBottom>Rotational Speed: {rotSpeed}</Typography>
                  <Slider value={rotSpeed} onChange={(_, v) => setRotSpeed(v as number)} min={1000} max={3000} />
                </Box>
                <Box>
                  <Typography gutterBottom>Torque: {torque}</Typography>
                  <Slider value={torque} onChange={(_, v) => setTorque(v as number)} min={1} max={100} />
                </Box>
                <Box>
                  <Typography gutterBottom>Tool Wear: {toolWear}</Typography>
                  <Slider value={toolWear} onChange={(_, v) => setToolWear(v as number)} min={0} max={300} />
                </Box>
                <FormControl fullWidth>
                  <InputLabel id="machine-type-label">Machine Type</InputLabel>
                  <Select
                    labelId="machine-type-label"
                    value={machineType}
                    label="Machine Type"
                    onChange={(e) => setMachineType(e.target.value as MachineType)}
                  >
                    <MenuItem value="H">H</MenuItem>
                    <MenuItem value="L">L</MenuItem>
                    <MenuItem value="M">M</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="contained" onClick={onPredict} disabled={predicting}>
                  {predicting ? "Predicting..." : "Run Prediction"}
                </Button>
                {prediction && (
                  <Alert severity={riskTone}>
                    <Typography sx={{ fontWeight: 700 }}>{prediction.message}</Typography>
                    <Typography variant="body2">{prediction.recommendation}</Typography>
                    <Chip
                      size="small"
                      label={`Failure probability: ${(prediction.failure_probability * 100).toFixed(2)}%`}
                      sx={{ mt: 1 }}
                    />
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Sample Manufacturing Data
          </Typography>
          <Paper variant="outlined" sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {Object.keys(sample?.rows?.[0] ?? {}).map((col) => (
                    <TableCell key={col}>{col}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(sample?.rows ?? []).map((row, idx) => (
                  <TableRow key={idx}>
                    {Object.values(row).map((val, i) => (
                      <TableCell key={i}>{String(val)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </CardContent>
      </Card>
    </Container>
  );
}

