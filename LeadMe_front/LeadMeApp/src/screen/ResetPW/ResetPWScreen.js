import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import SuccessModal from "../../components/SuccessModal";
import BackButton from '../../components/BackButton';
import axiosInstance from "../../config/axiosInstance";
import { styles } from './styles';
import Logo from '../../components/Logo';

const ResetPWScreen = ({ route, navigation }) => {
  const { username } = route.params;
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({ newPassword: "", general: "" });

  const handleResetPassword = async () => {
    let valid = true;
    let newErrors = { newPassword: "", general: "" };

    if (!newPassword || !confirmPassword) {
      setMessage("모든 정보를 입력해주세요.");
      return;
    }

    if (newPassword.length < 8) {
      newErrors.newPassword = "비밀번호는 8자 이상이어야 합니다.";
      valid = false;
    }

    if (newPassword !== confirmPassword) {
      newErrors.general = "비밀번호가 일치하지 않습니다.";
      valid = false;
    }

    setErrors(newErrors);

    if (valid) {
      try {
        const res = await axiosInstance.post("/api/auth/reset-password", {
          username: username,
          new_password: newPassword,
          new_password_confirm: confirmPassword,
        });

        console.log("비밀번호 재설정 성공:", res.data);
        setMessage("비밀번호가 성공적으로 재설정되었습니다.");
        setModalVisible(true);
      } catch (err) {
        console.error("비밀번호 재설정 실패:", err.response?.data || err);
        setMessage("비밀번호 재설정 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Logo/>
      <Text style={styles.header}>비밀번호 변경</Text>

      {/* 비밀번호 입력 */}
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        value={newPassword}
        onChangeText={(text) => {
          setNewPassword(text);

          if (text.length < 8) {
            setErrors((prev) => ({
              ...prev,
              newPassword: "비밀번호는 8자 이상이어야 합니다.",
            }));
          } else {
            setErrors((prev) => ({ ...prev, newPassword: "" }));
          }

          if (confirmPassword && text !== confirmPassword) {
            setErrors((prev) => ({
              ...prev,
              general: "비밀번호가 일치하지 않습니다.",
            }));
          } else {
            setErrors((prev) => ({ ...prev, general: "" }));
          }
        }}
        secureTextEntry
      />
      {errors.newPassword ? (
        <Text style={styles.error}>{errors.newPassword}</Text>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="비밀번호 재확인"
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);

          if (newPassword !== text) {
            setErrors((prev) => ({
              ...prev,
              general: "비밀번호가 일치하지 않습니다.",
            }));
          } else {
            setErrors((prev) => ({ ...prev, general: "" }));
          }
        }}
        secureTextEntry
      />
      {errors.general ? (
        <Text style={styles.error}>{errors.general}</Text>
      ) : null}

      <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
        <Text style={styles.buttonText}>비밀번호 변경</Text>
      </TouchableOpacity>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      {/* 성공 모달 */}
      <SuccessModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          navigation.navigate("Login");
        }}
      />

      <BackButton />
    </View>
  );
};

export default ResetPWScreen;

