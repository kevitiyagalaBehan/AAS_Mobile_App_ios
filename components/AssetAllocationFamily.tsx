import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from "react-native";
import React, { useState, useEffect } from "react";
import DonutChart from "./DonutChart";
import { RFPercentage } from "react-native-responsive-fontsize";
import { getColorForAssetClass } from "../src/utils/assetColors";
import { ChartData, PortfolioData } from "../src/navigation/types";

export default function AssetAllocationFamily({
  data,
  loading,
  error,
}: {
  data: PortfolioData | null;
  loading: boolean;
  error: string | null;
}) {
  const { width, height } = useWindowDimensions();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!data) return;

    const processed: ChartData[] = [];
    data.assetCategories?.forEach((category) =>
      category.assetClasses?.forEach((asset) => {
        processed.push({
          name: asset.assetClass,
          percentage: asset.percentage,
          color: getColorForAssetClass(asset.assetClass),
          legendFontColor: "#333",
          legendFontSize: RFPercentage(1.8),
        });
      })
    );
    setChartData(processed);
    const firstIndex = processed.findIndex((item) => item.percentage > 0);
    setSelectedIndex(firstIndex >= 0 ? firstIndex : null);
  }, [data]);

  const styles = getStyles(width, height);

  if (loading) {
    return <Text style={styles.loader}>Loading...</Text>;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (!data || error) {
    return (
      <Text style={styles.errorText}>No asset allocation data available</Text>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.border}>
        <Text style={styles.bodyText}>Asset Allocation</Text>
        {chartData.length > 0 ? (
          <View style={styles.chartContainer}>
            <View style={styles.donutWrapper}>
              <DonutChart
                data={chartData}
                size={Math.min(width * 0.36, 150)}
                selectedIndex={selectedIndex}
                onSelect={setSelectedIndex}
              />
            </View>
            <View style={styles.legendContainer}>
              {chartData.map((item, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.legendItem,
                    selectedIndex === index && styles.legendItemSelected,
                  ]}
                  onPress={() =>
                    setSelectedIndex(selectedIndex === index ? null : index)
                  }
                >
                  <View
                    style={[styles.colorBox, { backgroundColor: item.color }]}
                  />
                  <Text
                    style={[
                      styles.legendText,
                      selectedIndex === index && styles.legendTextSelected,
                    ]}
                  >
                    {item.name}: {item.percentage.toFixed(2)}%
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <Text style={styles.noDataText}>
            No asset allocation data available
          </Text>
        )}
      </View>
    </View>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fff",
      borderRadius: 6,
      marginTop: height * 0.01,
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
      marginTop: height * 0.363,
      marginLeft: height * 0.012,
    },
    bodyText: {
      //fontWeight: "bold",
      color: "#1B77BE",
      fontSize: RFPercentage(2.6),
      marginBottom: -15,
    },
    errorText: {
      color: "red",
      fontSize: RFPercentage(2),
      fontWeight: "bold",
      textAlign: "center",
      marginTop: height * 0.53,
    },
    noDataText: {
      textAlign: "center",
      marginTop: height * 0.01,
      fontSize: RFPercentage(2),
      color: "#666",
    },
    chartContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginVertical: height * 0.02,
    },
    donutWrapper: {
      marginRight: width * 0.04,
    },
    legendContainer: {
      flexShrink: 1,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 4,
      paddingHorizontal: 6,
      borderRadius: 4,
    },
    legendItemSelected: {
      backgroundColor: "#EAF3FA",
    },
    legendTextSelected: {
      fontWeight: "bold",
    },
    colorBox: {
      width: 12,
      height: 12,
      marginRight: 8,
      borderRadius: 3,
    },
    legendText: {
      fontSize: RFPercentage(2),
      color: "#000000",
    },
  });
