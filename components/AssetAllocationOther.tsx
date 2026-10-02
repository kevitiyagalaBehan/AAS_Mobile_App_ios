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
import { ChartData, PortfolioData, Props } from "../src/navigation/types";
import { getAssetAllocationSummaryOther } from "../src/utils/pimsApi";
import { useAuth } from "../src/context/AuthContext";

export default function AssetAllocationOther({ refreshTrigger }: Props) {
  const { userData } = useAuth();
  const [data, setData] = useState<PortfolioData | null>(null);
  const { width, height } = useWindowDimensions();
  const styles = getStyles(width, height);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
      const fetchData = async () => {
        if (!userData?.authToken || !userData?.accountId) {
          setLoading(false);
          return;
        }
        setLoading(true);
        try {
          const data = await getAssetAllocationSummaryOther(
            userData.authToken,
            userData.accountId
          );
          setData(data);
        } catch (err) {
          setError("Failed to load investment details");
        } finally {
          setLoading(false);
        }
      };
  
      fetchData();
    }, [userData?.authToken, userData?.accountId, refreshTrigger]);

  useEffect(() => {
    if (!data) return;

    const processed: ChartData[] = [];
    data.assetCategories?.forEach((category) =>
      category.assetClasses?.forEach((asset) => {
        processed.push({
          name: asset.assetClass,
          percentage: asset.percentage,
          color: getColorForAssetClass(asset.assetClass),
          legendFontColor: "#000000",
          legendFontSize: RFPercentage(2),
        });
      })
    );
    setChartData(processed);
    const firstIndex = processed.findIndex((item) => item.percentage > 0);
    setSelectedIndex(firstIndex >= 0 ? firstIndex : null);
  }, [data]);

  if (loading) {
    return <Text style={styles.loader}>Loading...</Text>;
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
      //marginBottom: height * 0.01,
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
      marginLeft: height * 0.02,
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
