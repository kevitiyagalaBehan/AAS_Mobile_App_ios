import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { RFPercentage } from "react-native-responsive-fontsize";
import { ChartData } from "../src/navigation/types";

export default function DonutChart({
  data,
  size,
  thickness = size * 0.18,
  selectedIndex,
  onSelect,
}: {
  data: ChartData[];
  size: number;
  thickness?: number;
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
}) {
  const selectedThickness = thickness * 1.2;
  // Leave room for the thicker selected stroke so it stays inside the chart
  const radius = (size - selectedThickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce(
    (sum, item) => sum + Math.max(item.percentage, 0),
    0
  );
  const sliceCount = data.filter((item) => item.percentage > 0).length;
  // Small gap between slices so adjacent colours stay distinct
  const gap = sliceCount > 1 ? 2 : 0;
  const selected = selectedIndex !== null ? data[selectedIndex] : null;

  let offset = 0;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          {total > 0 &&
            data.map((item, index) => {
              if (item.percentage <= 0) return null;
              const length = (item.percentage / total) * circumference;
              const isSelected = index === selectedIndex;
              const circle = (
                <Circle
                  key={index}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={item.color}
                  strokeWidth={isSelected ? selectedThickness : thickness}
                  strokeOpacity={selected && !isSelected ? 0.35 : 1}
                  strokeDasharray={`${Math.max(length - gap, 0)} ${circumference}`}
                  strokeDashoffset={-offset}
                  fill="transparent"
                  onPress={() => onSelect(isSelected ? null : index)}
                />
              );
              offset += length;
              return circle;
            })}
        </G>
      </Svg>
      <View
        pointerEvents="none"
        style={[
          styles.center,
          { padding: selectedThickness, borderRadius: size / 2 },
        ]}
      >
        {selected ? (
          <>
            <Text style={styles.value}>{selected.percentage.toFixed(2)}%</Text>
            <Text style={styles.label} numberOfLines={2}>
              {selected.name}
            </Text>
          </>
        ) : (
          <Text style={styles.hint}>Tap a segment</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: RFPercentage(2.4),
    fontWeight: "bold",
    color: "#1B77BE",
  },
  label: {
    fontSize: RFPercentage(1.6),
    color: "#333",
    textAlign: "center",
  },
  hint: {
    fontSize: RFPercentage(1.5),
    color: "#999",
    textAlign: "center",
  },
});
