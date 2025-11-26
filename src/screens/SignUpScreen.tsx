import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    Image,
    Alert,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    useWindowDimensions,
    Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { signUpUser } from "../utils/pimsApi";
import { SignUpScreenNavigationProp } from "../navigation/types";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { RFPercentage } from "react-native-responsive-fontsize";

export default function SignUpScreen() {
    const navigation = useNavigation<SignUpScreenNavigationProp>();
    const { width, height } = useWindowDimensions();

    const [firstName, setFirstname] = useState<string>("");
    const [lastName, setLastname] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [secureTextEntry, setSecureTextEntry] = useState<boolean>(true);

    const [emailError, setEmailError] = useState<string>("");
    const [passwordError, setPasswordError] = useState<string>("");
    const [firstNameError, setFirstNameError] = useState<string>("");
    const [lastNameError, setLastNameError] = useState<string>("");

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleSignUp = async () => {
        let valid = true;

        setFirstNameError("");
        setLastNameError("");
        setEmailError("");
        setPasswordError("");

        if (!firstName.trim()) {
            setFirstNameError("First name is required");
            valid = false;
        }

        if (!lastName.trim()) {
            setLastNameError("Last name is required");
            valid = false;
        }

        if (!validateEmail(email)) {
            setEmailError("Please enter a valid email");
            valid = false;
        }

        if (password !== confirmPassword) {
            setPasswordError("Passwords do not match");
            valid = false;
        }

        if (!valid) return;

        const result = await signUpUser(firstName, lastName, email, password);

        if (result.success) {
            Alert.alert("Success", result.message, [
                {
                    text: "OK",
                    onPress: () => navigation.navigate("Login"),
                },
            ]);
        } else {
            Alert.alert("Error", result.message);
        }
    };

    const styles = getStyles(width, height);

    return (
        <SafeAreaProvider>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ flex: 1 }}
            >
                <SafeAreaView style={styles.container}>
                    <Image
                        source={require("../../assets/aas_logo.png")}
                        style={styles.logo}
                        resizeMode="contain"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Enter First Name"
                        value={firstName}
                        onChangeText={setFirstname}
                        autoCapitalize="words"
                        placeholderTextColor="#999"
                    />
                    {firstNameError !== "" && <Text style={styles.errorText}>{firstNameError}</Text>}

                    <TextInput
                        style={styles.input}
                        placeholder="Enter Last Name"
                        value={lastName}
                        onChangeText={setLastname}
                        autoCapitalize="words"
                        placeholderTextColor="#999"
                    />
                    {lastNameError !== "" && <Text style={styles.errorText}>{lastNameError}</Text>}

                    <TextInput
                        style={styles.input}
                        placeholder="Enter Username/Email"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholderTextColor="#999"
                    />
                    {emailError !== "" && <Text style={styles.errorText}>{emailError}</Text>}

                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Enter Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={secureTextEntry}
                            autoCapitalize="none"
                            placeholderTextColor="#999"
                        />
                        <TouchableOpacity
                            onPress={() => setSecureTextEntry(!secureTextEntry)}
                            style={styles.eyeIconContainer}
                        >
                            <FontAwesome
                                name={secureTextEntry ? "eye" : "eye-slash"}
                                size={20}
                                color="#666"
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={secureTextEntry}
                            autoCapitalize="none"
                            placeholderTextColor="#999"
                        />
                        <TouchableOpacity
                            onPress={() => setSecureTextEntry(!secureTextEntry)}
                            style={styles.eyeIconContainer}
                        >
                            <FontAwesome
                                name={secureTextEntry ? "eye" : "eye-slash"}
                                size={20}
                                color="#666"
                            />
                        </TouchableOpacity>
                    </View>

                    {passwordError !== "" && (
                        <Text style={styles.errorText}>{passwordError}</Text>
                    )}

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleSignUp}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.loginButtonText}>Sign Up</Text>
                    </TouchableOpacity>
                    <View style={styles.signInContainer}>
                        <Text style={styles.signInText}>Already have an account?</Text>
                        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                            <Text style={styles.forgotPassword}>Sign In</Text>
                        </TouchableOpacity>

                    </View>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </SafeAreaProvider>
    );
}

const getStyles = (width: number, height: number) =>
    StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#fff",
            paddingHorizontal: 20,
        },
        logo: {
            width: width * 0.5,
            height: height * 0.2,
            //marginBottom: height * 0.05,
        },
        input: {
            width: "100%",
            padding: 15,
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 10,
            marginBottom: height * 0.01,
            fontSize: RFPercentage(2),
            color: "#333",
        },
        passwordContainer: {
            flexDirection: "row",
            alignItems: "center",
            width: "100%",
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 10,
            marginBottom: height * 0.01,
        },
        passwordInput: {
            flex: 1,
            padding: 15,
            fontSize: RFPercentage(2),
            color: "#333",
        },
        eyeIconContainer: {
            padding: 10,
            marginRight: width * 0.01,
        },
        loginButton: {
            backgroundColor: "#00205A",
            padding: 15,
            borderRadius: 10,
            width: "100%",
            alignItems: "center",
            marginVertical: height * 0.01,
        },
        loginButtonText: {
            color: "#fff",
            fontSize: RFPercentage(2),
            fontWeight: "bold",
        },
        forgotPassword: {
            color: "#1B77BE",
            fontSize: RFPercentage(2),
            textDecorationLine: "underline",
        },
        signInText: {
            fontSize: RFPercentage(2),
            marginRight: 5,
        },
        signInContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 10,
        },
        inputError: {
            borderColor: "#ff4444",
        },
        errorText: {
            color: "#ff4444",
            fontSize: RFPercentage(2),
            marginBottom: height * 0.015,
            paddingHorizontal: width * 0.005,
        },
        buttonContainer: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: height * 0.01,
        },
        button: {
            padding: 12,
            borderRadius: 10,
            width: "48%",
            alignItems: "center",
        },
        submitButton: {
            backgroundColor: "#00205A",
        },
        closeButton: {
            backgroundColor: "#ccc",
        },
        buttonText: {
            color: "white",
            fontSize: RFPercentage(2),
            fontWeight: "bold",
        },
    });
