import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from "react-native";
import React, { useState, useEffect } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAuth } from "../src/context/AuthContext";
import { getCashTransactions } from "../src/utils/pimsApi";
import { CashTransactions } from "../src/navigation/types";
import { useRefreshTrigger } from "../hooks/useRefreshTrigger";
import { formatCurrency, formatShortDate } from "../src/utils/format";
import { colors } from "../src/theme/colors";
import Card from "./Card";
import DetailModal from "./DetailModal";

const CREDIT_COLOR = "#15803D";

// Local yyyy-mm-dd. toISOString() would give the UTC date, which in Australia
// is the previous day until 10/11am.
const toApiDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const cleanDescription = (description: string) =>
  description?.includes("Closing Balance")
    ? description.replace("Closing Balance", "").trim()
    : description;

// Running balance shown against each row, as the previous table did
const rowBalance = (item: CashTransactions) => {
  if (item.credit != null) return item.balance - item.credit;
  if (item.debit != null) return item.balance + item.debit;
  return item.balance;
};

// Bank screen: cash transactions for a date range, filterable by account
export default function Transactions() {
  const { userData } = useAuth();
  const { width, height } = useWindowDimensions();
  const [transactions, setTransactions] = useState<CashTransactions[] | null>(
    null
  );
  const [startDate, setStartDate] = useState(() => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return oneMonthAgo;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [openPicker, setOpenPicker] = useState<"start" | "end" | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<CashTransactions | null>(
    null
  );
  const [selectedHolding, setSelectedHolding] = useState("");

  const fetchData = async () => {
    if (!userData?.authToken || !userData?.accountId) {
      setFetching(false);
      return;
    }

    setFetching(true);
    try {
      const data = await getCashTransactions(
        userData.authToken,
        userData.accountId,
        toApiDate(startDate),
        toApiDate(endDate)
      );
      setTransactions(data || []);
      setError(null);
    } catch (err) {
      setError("Failed to load transaction details");
    } finally {
      setFetching(false);
    }
  };

  const { refreshing, onRefresh } = useRefreshTrigger(fetchData);

  // Reload whenever the date range changes, so there's no separate Filter step
  useEffect(() => {
    fetchData();
  }, [userData?.authToken, userData?.accountId, startDate, endDate]);

  const holdings = Array.from(
    new Set((transactions || []).map((t) => t.holdingDescription))
  );
  // Drop an account filter that no longer exists in the new date range
  const activeHolding = holdings.includes(selectedHolding) ? selectedHolding : "";

  const filteredTransactions = (transactions || []).filter(
    (t) => !activeHolding || t.holdingDescription === activeHolding
  );
  const moneyIn = filteredTransactions.reduce((sum, t) => sum + (t.credit ?? 0), 0);
  const moneyOut = filteredTransactions.reduce((sum, t) => sum + (t.debit ?? 0), 0);

  const styles = getStyles(width, height);

  if (fetching && !transactions) {
    return <ActivityIndicator style={styles.loader} color={colors.primary} />;
  }

  if (error && !transactions) {
    return <Text style={styles.stateText}>{error}</Text>;
  }

  const pickerValue = openPicker === "start" ? startDate : endDate;
  const onPick = (date: Date) =>
    openPicker === "start" ? setStartDate(date) : setEndDate(date);
  const pickerLimits =
    openPicker === "start"
      ? { maximumDate: endDate }
      : { minimumDate: startDate, maximumDate: new Date() };

  const header = (
    <View>
      <View style={styles.dateRow}>
        {(["start", "end"] as const).map((which) => (
          <TouchableOpacity
            key={which}
            style={styles.dateChip}
            onPress={() => setOpenPicker(which)}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <View style={styles.dateChipText}>
              <Text style={styles.dateLabel}>
                {which === "start" ? "From" : "To"}
              </Text>
              <Text style={styles.dateValue}>
                {formatShortDate(which === "start" ? startDate : endDate)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {holdings.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {["", ...holdings].map((holding) => {
            const active = holding === activeHolding;
            return (
              <TouchableOpacity
                key={holding || "all"}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedHolding(holding)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                  numberOfLines={1}
                >
                  {holding || "All accounts"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <Card style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Money in</Text>
          <Text style={[styles.summaryValue, { color: CREDIT_COLOR }]}>
            {formatCurrency(moneyIn)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Money out</Text>
          <Text style={styles.summaryValue}>{formatCurrency(moneyOut)}</Text>
        </View>
      </Card>

      <View style={styles.listHeading}>
        <Text style={styles.listTitle}>Transactions</Text>
        {fetching ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={styles.listCount}>{filteredTransactions.length}</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={header}
        renderItem={({ item, index }) => {
          const isCredit = item.credit != null;
          const amount = item.credit ?? item.debit;
          const isFirst = index === 0;
          const isLast = index === filteredTransactions.length - 1;

          return (
            <TouchableOpacity
              style={[
                styles.row,
                isFirst && styles.rowFirst,
                isLast && styles.rowLast,
              ]}
              onPress={() => setSelectedItem(item)}
              activeOpacity={0.6}
            >
              <View
                style={[
                  styles.rowIcon,
                  { backgroundColor: isCredit ? "#DCFCE7" : colors.primarySoft },
                ]}
              >
                <Ionicons
                  name={isCredit ? "arrow-down" : "arrow-up"}
                  size={18}
                  color={isCredit ? CREDIT_COLOR : colors.primary}
                />
              </View>
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {cleanDescription(item.transactionDescription)}
                </Text>
                <Text style={styles.rowSubtitle} numberOfLines={1}>
                  {formatShortDate(item.transactionDate)}
                  {holdings.length > 1 && !activeHolding
                    ? ` · ${item.holdingDescription}`
                    : ""}
                </Text>
              </View>
              <View style={styles.rowAmounts}>
                {amount != null && (
                  <Text
                    style={[styles.rowAmount, isCredit && { color: CREDIT_COLOR }]}
                  >
                    {isCredit ? "+" : "−"}
                    {formatCurrency(amount)}
                  </Text>
                )}
                <Text style={styles.rowBalance}>
                  Bal {formatCurrency(rowBalance(item))}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          fetching ? null : (
            <Card style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={32} color="#9CA3AF" />
              <Text style={styles.emptyText}>
                {error ?? "No transactions in this period"}
              </Text>
            </Card>
          )
        }
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {openPicker &&
        (Platform.OS === "android" ? (
          <DateTimePicker
            value={pickerValue}
            mode="date"
            display="default"
            {...pickerLimits}
            onChange={(event, selectedDate) => {
              setOpenPicker(null);
              if (event.type === "set" && selectedDate) onPick(selectedDate);
            }}
          />
        ) : (
          <Modal
            transparent={true}
            animationType="slide"
            visible={true}
            onRequestClose={() => setOpenPicker(null)}
          >
            <View style={styles.sheetBackdrop}>
              <View style={styles.sheet}>
                <Text style={styles.sheetTitle}>
                  {openPicker === "start" ? "From date" : "To date"}
                </Text>
                <DateTimePicker
                  value={pickerValue}
                  mode="date"
                  display="inline"
                  accentColor={colors.primary}
                  {...pickerLimits}
                  onChange={(_, selectedDate) => {
                    if (selectedDate) onPick(selectedDate);
                  }}
                />
                <TouchableOpacity
                  style={styles.sheetButton}
                  onPress={() => setOpenPicker(null)}
                >
                  <Text style={styles.sheetButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        ))}

      <DetailModal
        visible={!!selectedItem}
        title={selectedItem ? cleanDescription(selectedItem.transactionDescription) : ""}
        subtitle={selectedItem?.holdingDescription}
        rows={
          selectedItem
            ? [
                { label: "Date", value: formatShortDate(selectedItem.transactionDate) },
                { label: "Classification", value: selectedItem.classification },
                {
                  label: "Withdrawal",
                  value:
                    selectedItem.debit != null
                      ? formatCurrency(selectedItem.debit)
                      : "—",
                },
                {
                  label: "Deposit",
                  value:
                    selectedItem.credit != null
                      ? formatCurrency(selectedItem.credit)
                      : "—",
                },
                { label: "Balance", value: formatCurrency(selectedItem.balance) },
              ]
            : []
        }
        onClose={() => setSelectedItem(null)}
      />
    </View>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    listContent: {
      paddingBottom: height * 0.04,
    },
    loader: {
      marginTop: height * 0.1,
    },
    stateText: {
      color: "#6B7280",
      fontSize: RFPercentage(2),
      textAlign: "center",
      marginTop: height * 0.1,
    },
    dateRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 12,
    },
    dateChip: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#E5E7EB",
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    dateChipText: {
      marginLeft: 10,
    },
    dateLabel: {
      fontSize: RFPercentage(1.6),
      color: "#6B7280",
    },
    dateValue: {
      fontSize: RFPercentage(1.95),
      fontWeight: "600",
      color: colors.primary,
      marginTop: 1,
    },
    chipRow: {
      gap: 8,
      paddingTop: 12,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: "#E5E7EB",
      maxWidth: width * 0.6,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: RFPercentage(1.8),
      color: colors.primary,
      fontWeight: "600",
    },
    chipTextActive: {
      color: "#fff",
    },
    summaryCard: {
      flexDirection: "row",
      alignItems: "center",
    },
    summaryItem: {
      flex: 1,
    },
    summaryDivider: {
      width: StyleSheet.hairlineWidth,
      alignSelf: "stretch",
      backgroundColor: "#E5E7EB",
      marginHorizontal: 16,
    },
    summaryLabel: {
      fontSize: RFPercentage(1.7),
      color: "#6B7280",
    },
    summaryValue: {
      fontSize: RFPercentage(2.4),
      fontWeight: "bold",
      color: colors.primary,
      marginTop: 4,
    },
    listHeading: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 20,
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    listTitle: {
      fontSize: RFPercentage(2.2),
      fontWeight: "bold",
      color: colors.primary,
    },
    listCount: {
      fontSize: RFPercentage(1.8),
      color: "#6B7280",
    },
    // Rows are drawn as one continuous card: side borders on every row,
    // top corners on the first and bottom corners on the last
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: "#E5E7EB",
    },
    rowFirst: {
      borderTopWidth: 1,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    rowLast: {
      borderBottomWidth: 1,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
    },
    rowIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    rowMain: {
      flex: 1,
      marginRight: 10,
    },
    rowTitle: {
      fontSize: RFPercentage(1.95),
      fontWeight: "600",
      color: "#111827",
    },
    rowSubtitle: {
      fontSize: RFPercentage(1.65),
      color: "#6B7280",
      marginTop: 2,
    },
    rowAmounts: {
      alignItems: "flex-end",
    },
    rowAmount: {
      fontSize: RFPercentage(2),
      fontWeight: "bold",
      color: "#111827",
    },
    rowBalance: {
      fontSize: RFPercentage(1.55),
      color: "#9CA3AF",
      marginTop: 2,
    },
    emptyCard: {
      alignItems: "center",
      paddingVertical: 28,
    },
    emptyText: {
      marginTop: 8,
      color: "#6B7280",
      fontSize: RFPercentage(1.9),
      textAlign: "center",
    },
    sheetBackdrop: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.3)",
    },
    sheet: {
      backgroundColor: "#fff",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 16,
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    sheetTitle: {
      fontSize: RFPercentage(2.1),
      fontWeight: "bold",
      color: colors.primary,
      textAlign: "center",
    },
    sheetButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      marginTop: 8,
    },
    sheetButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: RFPercentage(2),
    },
  });
