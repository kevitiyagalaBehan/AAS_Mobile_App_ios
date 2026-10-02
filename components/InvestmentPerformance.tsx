import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAuth } from "../src/context/AuthContext";
import { getInvestmentPerformance } from "../src/utils/pimsApi";
import { InvestmentPerformanceDetails, Props } from "../src/navigation/types";
import { useWindowSize } from "../hooks/useWindowSize";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MAX_X_LABELS = 5;

const formatShortDate = (date: Date) =>
  `${MONTHS[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`;

const formatFullDate = (date: Date) =>
  `${String(date.getDate()).padStart(2, "0")} ${
    MONTHS[date.getMonth()]
  } ${date.getFullYear()}`;

export default function InvestmentPerformance({ refreshTrigger }: Props) {
  const { userData } = useAuth();
  const { width, height, isPortrait } = useWindowSize();
  const [data, setData] = useState<InvestmentPerformanceDetails[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Default to the latest point whenever data loads or refreshes
  useEffect(() => {
    setSelectedIndex(data && data.length > 0 ? data.length - 1 : null);
  }, [data]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.authToken || !userData?.accountId) return;
      setLoading(true);
      try {
        const result = await getInvestmentPerformance(
          userData.authToken,
          userData.accountId
        );
        if (result) {
          setData(result);
        } else {
          setError("Failed to load investment performance.");
        }
      } catch {
        setError("Error fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userData?.authToken, userData?.accountId, refreshTrigger]);

  const styles = getStyles(width, height);

  if (loading) {
    return <Text style={styles.loader}>Loading...</Text>;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (!data || data.length === 0) {
    return <Text style={styles.errorText}>No investment data available</Text>;
  }

  const values = data.map((item) => item.cumulativePercent);

  // Show a few evenly spaced short labels so they fit without rotating
  const labelStep = Math.max(1, Math.ceil(data.length / MAX_X_LABELS));
  const labels = data.map((item, index) =>
    index % labelStep === 0 ? formatShortDate(new Date(item.date)) : ""
  );

  const selected = selectedIndex !== null ? data[selectedIndex] : null;

  return (
    <View style={styles.container}>
      <View style={styles.border}>
        <Text style={styles.bodyText}>Investment Performance</Text>
        {selected && (
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedDate}>
              {formatFullDate(new Date(selected.date))}
            </Text>
            <Text
              style={[
                styles.selectedValue,
                {
                  color:
                    selected.cumulativePercent < 0 ? "#C0392B" : "#1E8449",
                },
              ]}
            >
              {selected.cumulativePercent > 0 ? "+" : ""}
              {selected.cumulativePercent.toFixed(2)}%
            </Text>
          </View>
        )}
        <View style={{ alignItems: "center", paddingBottom: height * 0.01 }}>
          <LineChart
            data={{
              labels,
              datasets: [
                {
                  data: values,
                  strokeWidth: 3,
                  color: () => "#1B77BE",
                },
              ],
            }}
            width={width * 0.9}
            height={isPortrait ? height * 0.4 : height * 0.9}
            yAxisInterval={1}
            yAxisSuffix="%"
            withDots
            // Every point gets an invisible tap target; only the selected one is drawn
            getDotProps={(_, index) =>
              index === selectedIndex
                ? { r: "5", fill: "#1B77BE", stroke: "#fff", strokeWidth: 2 }
                : { r: "8", fill: "transparent" }
            }
            onDataPointClick={({ index }) => setSelectedIndex(index)}
            withShadow={false}
            fromZero
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={true}
            withHorizontalLines={true}
            segments={4}
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              propsForBackgroundLines: {
                stroke: "#f0f0f0",
                strokeDasharray: "",
              },
              propsForLabels: {
                fontSize: RFPercentage(1.5),
              },
            }}
          />
        </View>
      </View>
    </View>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fff",
      marginTop: height * 0.02,
      borderRadius: 6,
    },
    border: {
      borderWidth: 1,
      borderColor: "#1B77BE",
      borderRadius: 6,
      paddingHorizontal: width * 0.02,
    },
    loader: {
      fontWeight: "bold",
      color: "#1B77BE",
      fontSize: RFPercentage(2.6),
      marginTop: height * 0.021,
      marginLeft: height * 0.01,
    },
    bodyText: {
      //fontWeight: "bold",
      color: "#1B77BE",
      marginBottom: height * 0.005,
      fontSize: RFPercentage(2.6),
    },
    selectedInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: height * 0.01,
    },
    selectedDate: {
      fontSize: RFPercentage(1.8),
      color: "#666",
    },
    selectedValue: {
      fontSize: RFPercentage(2.4),
      fontWeight: "bold",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    errorText: {
      color: "red",
      fontSize: RFPercentage(2),
      fontWeight: "bold",
      textAlign: "center",
      marginTop: height * 0.2,
    },
  });
