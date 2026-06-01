import React, { useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import {
  Alert,
  Animated,
  Image,
  InteractionManager,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  NativeModules,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  UIManager,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect, Text as SvgText } from "react-native-svg";
const { logAppError, logAppInfo, logAppWarning } = require("./services/app-logger");

const tabs = [
  { key: "workout", label: "Workout", icon: require("./assets/nav/workout-tab.png") },
  { key: "progress", label: "Dashboard", icon: require("./assets/nav/home-tab.png") },
  { key: "diary", label: "Diary", icon: require("./assets/nav/food-tab.png") },
];
const threeDotsMenuIcon = require("./assets/ui/three-dots-menu.png");
const flashOnIcon = require("./assets/ui/flash-on.png");
const flashOffIcon = require("./assets/ui/flash-off.png");
const trashActionIcon = require("./assets/ui/trash-action.png");
const starOutlineIcon = require("./assets/ui/star-outline.png");
const starFilledIcon = require("./assets/ui/star-filled.png");
const bulletDotIcon = require("./assets/ui/bullet-dot.png");
const { signUpWithPassword, signInWithPassword, signOut: signOutSupabase, getUser } = require("./services/auth");
const {
  saveProfile: saveCloudProfile,
  loadProfile: loadCloudProfile,
  replaceAllDiaryEntries,
  replaceAllCheckIns,
  replaceAllWorkoutTemplates,
  replaceAllTrainingPrograms,
  replaceAllCompletedWorkouts,
  loadAllWorkoutTemplates,
  loadAllTrainingPrograms,
  loadAllDiaryEntries,
  loadCheckIns: loadCloudCheckIns,
  loadAllCompletedWorkouts,
} = require("./services/cloud-sync");

const mealOrder = ["Breakfast", "Lunch", "Dinner", "Snacks", "Other"];
const macroMeta = [
  { key: "calories", label: "Calories", unit: "kcal", color: "#e58b58" },
  { key: "protein", label: "Protein", unit: "g", color: "#49b976" },
  { key: "carbs", label: "Carbs", unit: "g", color: "#6ea0ff" },
  { key: "fat", label: "Fat", unit: "g", color: "#ba83f0" },
];

const goals = {
  calories: 3200,
  protein: 220,
  carbs: 320,
  fat: 90,
};

const micronutrientMeta = [
  { key: "fiber", label: "Fiber", unit: "g", category: "Other Nutrition", target: 38, numbers: ["291"], names: ["fiber", "dietary fiber"] },
  { key: "sugar", label: "Sugar", unit: "g", category: "Other Nutrition", target: null, numbers: ["269"], names: ["sugars, total", "total sugars", "sugar"] },
  { key: "saturatedFat", label: "Saturated Fat", unit: "g", category: "Other Nutrition", target: 20, numbers: ["606"], names: ["fatty acids, total saturated", "saturated fat"] },
  { key: "cholesterol", label: "Cholesterol", unit: "mg", category: "Other Nutrition", target: 300, numbers: ["601"], names: ["cholesterol"] },
  { key: "vitaminA", label: "Vitamin A", unit: "mcg", category: "Vitamins", target: 900, numbers: ["320", "318"], names: ["vitamin a", "vitamin a, rae", "retinol activity equivalent"] },
  { key: "vitaminC", label: "Vitamin C", unit: "mg", category: "Vitamins", target: 90, numbers: ["401"], names: ["vitamin c", "vitamin c, total ascorbic acid", "ascorbic acid"] },
  { key: "vitaminD", label: "Vitamin D", unit: "mcg", category: "Vitamins", target: 20, numbers: ["324", "328"], names: ["vitamin d", "vitamin d (d2 + d3)"] },
  { key: "vitaminE", label: "Vitamin E", unit: "mg", category: "Vitamins", target: 15, numbers: ["323"], names: ["vitamin e", "vitamin e (alpha-tocopherol)", "tocopherol, alpha"] },
  { key: "vitaminK", label: "Vitamin K", unit: "mcg", category: "Vitamins", target: 120, numbers: ["430"], names: ["vitamin k", "vitamin k (phylloquinone)", "phylloquinone"] },
  { key: "thiamin", label: "Thiamin (B1)", unit: "mg", category: "Vitamins", target: 1.2, numbers: ["404"], names: ["thiamin", "thiamin (b1)", "vitamin b-1"] },
  { key: "riboflavin", label: "Riboflavin (B2)", unit: "mg", category: "Vitamins", target: 1.3, numbers: ["405"], names: ["riboflavin", "riboflavin (b2)", "vitamin b-2"] },
  { key: "niacin", label: "Niacin (B3)", unit: "mg", category: "Vitamins", target: 16, numbers: ["406"], names: ["niacin", "niacin (b3)", "vitamin b-3"] },
  { key: "vitaminB6", label: "Vitamin B6", unit: "mg", category: "Vitamins", target: 1.7, numbers: ["415"], names: ["vitamin b-6", "vitamin b6", "pyridoxine"] },
  { key: "folate", label: "Folate", unit: "mcg", category: "Vitamins", target: 400, numbers: ["417"], names: ["folate", "folate, total", "folic acid"] },
  { key: "vitaminB12", label: "Vitamin B12", unit: "mcg", category: "Vitamins", target: 2.4, numbers: ["418"], names: ["vitamin b-12", "vitamin b12", "cobalamin"] },
  { key: "choline", label: "Choline", unit: "mg", category: "Vitamins", target: 550, numbers: ["421"], names: ["choline", "choline, total"] },
  { key: "calcium", label: "Calcium", unit: "mg", category: "Minerals", target: 1300, numbers: ["301"], names: ["calcium", "ca"] },
  { key: "iron", label: "Iron", unit: "mg", category: "Minerals", target: 18, numbers: ["303"], names: ["iron", "fe"] },
  { key: "magnesium", label: "Magnesium", unit: "mg", category: "Minerals", target: 420, numbers: ["304"], names: ["magnesium", "mg"] },
  { key: "phosphorus", label: "Phosphorus", unit: "mg", category: "Minerals", target: 1250, numbers: ["305"], names: ["phosphorus", "p"] },
  { key: "potassium", label: "Potassium", unit: "mg", category: "Minerals", target: 4700, numbers: ["306"], names: ["potassium", "k"] },
  { key: "sodium", label: "Sodium", unit: "mg", category: "Minerals", target: 2300, numbers: ["307"], names: ["sodium", "na"] },
  { key: "zinc", label: "Zinc", unit: "mg", category: "Minerals", target: 11, numbers: ["309"], names: ["zinc", "zn"] },
  { key: "copper", label: "Copper", unit: "mg", category: "Minerals", target: 0.9, numbers: ["312"], names: ["copper", "cu"] },
  { key: "manganese", label: "Manganese", unit: "mg", category: "Minerals", target: 2.3, numbers: ["315"], names: ["manganese", "mn"] },
  { key: "selenium", label: "Selenium", unit: "mcg", category: "Minerals", target: 55, numbers: ["317"], names: ["selenium", "se"] },
];

const micronutrientMetaByKey = Object.fromEntries(micronutrientMeta.map((item) => [item.key, item]));

const theme = {
  bg: "#060b09",
  bgElevated: "#0b1210",
  panel: "#101715",
  panelAlt: "#141d1a",
  panelRaised: "#182320",
  field: "#121b18",
  border: "rgba(128, 147, 138, 0.18)",
  borderStrong: "rgba(128, 147, 138, 0.28)",
  accent: "#00ff99",
  accentSoft: "rgba(102, 255, 191, 0.14)",
  accentBorder: "rgba(102, 255, 191, 0.26)",
  accentTextDark: "#04110c",
  text: "#f2fbf7",
  textMuted: "#93a79f",
  textSubtle: "#b8cbc3",
  overlay: "rgba(4, 9, 7, 0.88)",
};

const ProfileHeadIcon = ({ size = 24, color = theme.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 256 256" fill="none">
    <Circle cx="128" cy="94" r="38" stroke={color} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M58 206c8-43 39-70 70-70s62 27 70 70" stroke={color} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M87 204h82" stroke={color} strokeWidth="14" strokeLinecap="round" />
  </Svg>
);

const PencilIcon = ({ size = 22, color = theme.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 256 256" fill="none">
    <Path d="M72 184l14-48 76-76c12-12 31-12 43 0s12 31 0 43l-76 76-48 14c-6 2-11-3-9-9z" stroke={color} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M151 72l33 33" stroke={color} strokeWidth="14" strokeLinecap="round" />
    <Path d="M86 136l34 34" stroke={color} strokeWidth="14" strokeLinecap="round" />
  </Svg>
);

const GearIcon = ({ size = 24, color = theme.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 256 256" fill="none">
    <Path d="M128 82v-22M128 196v-22M82 128H60M196 128h-22M95 95l-16-16M177 177l-16-16M161 95l16-16M79 177l16-16" stroke={color} strokeWidth="14" strokeLinecap="round" />
    <Path d="M128 174c25.4 0 46-20.6 46-46s-20.6-46-46-46-46 20.6-46 46 20.6 46 46 46z" stroke={color} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M128 146c9.9 0 18-8.1 18-18s-8.1-18-18-18-18 8.1-18 18 8.1 18 18 18z" stroke={color} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckMarkIcon = ({ size = 24, color = theme.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 256 256" fill="none">
    <Path d="M62 132l43 43 89-94" stroke={color} strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TriangleArrowIcon = ({ size = 20, color = theme.accent, direction = "right" }) => {
  const rotation = direction === "left" ? "180deg" : direction === "up" ? "-90deg" : direction === "down" ? "90deg" : "0deg";
  return (
    <View style={{ transform: [{ rotate: rotation }] }}>
      <Svg width={size} height={size} viewBox="0 0 256 256" fill="none">
        <Path d="M88 62l94 66-94 66V62z" stroke={color} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
};

const CalendarIcon = ({ size = 22, color = theme.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 256 256" fill="none">
    <Rect x="56" y="70" width="144" height="128" rx="22" stroke={color} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M88 52v36M168 52v36M57 110h142" stroke={color} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M91 139h1M128 139h1M165 139h1M91 169h1M128 169h1M165 169h1" stroke={color} strokeWidth="18" strokeLinecap="round" />
  </Svg>
);

const DotIcon = ({ size = 16, color = theme.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 256 256" fill="none">
    <Circle cx="128" cy="128" r="22" fill={color} />
  </Svg>
);

const FATSECRET_PROXY_PORT = "4173";
const DEFAULT_SEARCH_MESSAGE = "Search FS Food Data for a food, then choose a serving before adding it to a meal.";
const DEFAULT_TORCH_ENABLED = Platform.OS !== "ios";
const FATSECRET_REQUEST_TIMEOUT_MS = 3500;
const BARCODE_PROXY_TIMEOUT_MS = 2500;
const BARCODE_DIRECT_TIMEOUT_MS = 3500;
const LIVE_SEARCH_MIN_QUERY_LENGTH = 2;
const barcodeFoodCache = new Map();

const foodLibrary = [
  {
    id: "chicken-rice-bowl",
    name: "Chicken Rice Bowl",
    brand: "DualFit Kitchen",
    keywords: ["chicken", "rice", "bowl", "meal", "protein"],
    servings: [
      { id: "serving", label: "1 serving", multiplier: 1 },
      { id: "half-serving", label: "1/2 serving", multiplier: 0.5 },
      { id: "grams", label: "100 g", multiplier: 0.31 },
    ],
    macros: { calories: 492.8, protein: 44.2, carbs: 55, fat: 9.9 },
  },
  {
    id: "banana",
    name: "Banana",
    brand: "Produce",
    keywords: ["banana", "fruit", "carbs", "potassium"],
    servings: [
      { id: "medium", label: "1 medium banana", multiplier: 1 },
      { id: "half", label: "1/2 banana", multiplier: 0.5 },
      { id: "grams", label: "100 g", multiplier: 0.85 },
    ],
    macros: { calories: 105, protein: 1.3, carbs: 26.9, fat: 0.4 },
  },
  {
    id: "greek-yogurt",
    name: "Greek Yogurt",
    brand: "Sample Foods",
    keywords: ["greek", "yogurt", "yoghurt", "protein", "snack"],
    servings: [
      { id: "container", label: "1 container", multiplier: 1 },
      { id: "half", label: "1/2 container", multiplier: 0.5 },
      { id: "cup", label: "1 cup", multiplier: 1.34 },
    ],
    macros: { calories: 164.9, protein: 17.5, carbs: 6.5, fat: 7 },
  },
  {
    id: "oats",
    name: "Rolled Oats",
    brand: "Pantry Staples",
    keywords: ["oats", "oatmeal", "carbs", "breakfast", "grain"],
    servings: [
      { id: "half-cup", label: "1/2 cup dry", multiplier: 1 },
      { id: "quarter-cup", label: "1/4 cup dry", multiplier: 0.5 },
      { id: "grams", label: "100 g", multiplier: 2.5 },
    ],
    macros: { calories: 156, protein: 6.8, carbs: 26.5, fat: 2.8 },
  },
  {
    id: "whey",
    name: "Whey Protein",
    brand: "Sample Supplement",
    keywords: ["whey", "protein", "iso100", "dymatize", "isolate", "shake"],
    servings: [
      { id: "scoop", label: "1 scoop", multiplier: 1 },
      { id: "half-scoop", label: "1/2 scoop", multiplier: 0.5 },
      { id: "two-scoops", label: "2 scoops", multiplier: 2 },
    ],
    macros: { calories: 128, protein: 25.6, carbs: 2.6, fat: 1.9 },
  },
  {
    id: "salmon",
    name: "Atlantic Salmon",
    brand: "Seafood Counter",
    keywords: ["salmon", "fish", "seafood", "omega", "protein"],
    servings: [
      { id: "fillet", label: "1 fillet", multiplier: 1 },
      { id: "half-fillet", label: "1/2 fillet", multiplier: 0.5 },
      { id: "100g", label: "100 g", multiplier: 0.65 },
    ],
    macros: { calories: 320, protein: 30.8, carbs: 0, fat: 20 },
  },
];

const exerciseCatalog = [
  { id: "barbell-incline-bench-press", name: "Barbell Incline Bench Press", equipment: "Barbell", muscleGroups: ["Upper Chest", "Front Delts", "Triceps"] },
  { id: "machine-chest-press", name: "Machine Chest Press", equipment: "Machine", muscleGroups: ["Mid/Lower Chest", "Front Delts", "Triceps"] },
  { id: "cable-fly-mid", name: "Cable Fly (Mid)", equipment: "Cable", muscleGroups: ["Mid/Lower Chest"] },
  { id: "cable-pushdown", name: "Cable Pushdown", equipment: "Cable", muscleGroups: ["Triceps"] },
  { id: "overhead-cable-triceps-extension", name: "Overhead Cable Triceps Extension", equipment: "Cable", muscleGroups: ["Triceps"] },
  { id: "back-squat", name: "Back Squat", equipment: "Barbell", muscleGroups: ["Quads", "Glutes"] },
  { id: "romanian-deadlift", name: "Romanian Deadlift", equipment: "Barbell", muscleGroups: ["Hamstrings", "Glutes", "Lower Back"] },
  { id: "leg-press", name: "Leg Press", equipment: "Machine", muscleGroups: ["Quads", "Glutes"] },
  { id: "leg-extension", name: "Leg Extension", equipment: "Machine", muscleGroups: ["Quads"] },
  { id: "standing-calf-raise", name: "Standing Calf Raise", equipment: "Machine", muscleGroups: ["Calves"] },
  { id: "machine-shoulder-press", name: "Machine Shoulder Press", equipment: "Machine", muscleGroups: ["Front Delts", "Side Delts", "Triceps"] },
  { id: "cable-lateral-raise", name: "Cable Lateral Raise", equipment: "Cable", muscleGroups: ["Side Delts"] },
  { id: "cable-rear-delt-fly", name: "Cable Rear Delt Fly", equipment: "Cable", muscleGroups: ["Rear Delts"] },
  { id: "rope-pushdown", name: "Rope Pushdown", equipment: "Cable", muscleGroups: ["Triceps"] },
  { id: "wide-grip-lat-pulldown", name: "Wide-Grip Lat Pulldown", equipment: "Cable", muscleGroups: ["Lats", "Biceps"] },
  { id: "seated-cable-row", name: "Seated Cable Row", equipment: "Cable", muscleGroups: ["Mid/Upper Back", "Lats", "Biceps"] },
  { id: "chest-supported-t-bar-row", name: "Chest-Supported T-Bar Row", equipment: "Machine", muscleGroups: ["Mid/Upper Back", "Lats", "Biceps"] },
  { id: "barbell-curl", name: "Barbell Curl", equipment: "Barbell", muscleGroups: ["Biceps"] },
  { id: "incline-dumbbell-curl", name: "Incline Dumbbell Curl", equipment: "Dumbbell", muscleGroups: ["Biceps"] },
  { id: "neutral-grip-lat-pulldown", name: "Neutral-Grip Lat Pulldown", equipment: "Cable", muscleGroups: ["Lats", "Biceps"] },
  { id: "wide-grip-seated-cable-row", name: "Wide-Grip Seated Cable Row", equipment: "Cable", muscleGroups: ["Mid/Upper Back", "Rear Delts", "Biceps"] },
  { id: "chest-supported-dumbbell-row", name: "Chest-Supported Dumbbell Row", equipment: "Dumbbell", muscleGroups: ["Mid/Upper Back", "Lats", "Biceps"] },
  { id: "machine-low-row", name: "Machine Low Row", equipment: "Machine", muscleGroups: ["Lats", "Mid/Upper Back", "Biceps"] },
  { id: "hammer-curl", name: "Hammer Curl", equipment: "Dumbbell", muscleGroups: ["Biceps", "Forearms"] },
  { id: "cable-curl", name: "Cable Curl", equipment: "Cable", muscleGroups: ["Biceps"] },
  { id: "ez-bar-curl", name: "EZ-Bar Curl", equipment: "Barbell", muscleGroups: ["Biceps"] },
  { id: "barbell-bent-over-row", name: "Barbell Bent-Over Row", equipment: "Barbell", muscleGroups: ["Mid/Upper Back", "Lats", "Lower Back"] },
  { id: "barbell-bench-press", name: "Barbell Bench Press", equipment: "Barbell", muscleGroups: ["Chest", "Front Delts", "Triceps"] },
  { id: "incline-barbell-bench-press", name: "Incline Barbell Bench Press", equipment: "Barbell", muscleGroups: ["Upper Chest", "Front Delts", "Triceps"] },
  { id: "low-incline-dumbbell-press", name: "Low Incline Dumbbell Press", equipment: "Dumbbell", muscleGroups: ["Upper Chest", "Front Delts", "Triceps"] },
  { id: "high-incline-dumbbell-press", name: "High Incline Dumbbell Press", equipment: "Dumbbell", muscleGroups: ["Upper Chest", "Front Delts", "Triceps"] },
  { id: "flat-dumbbell-press", name: "Flat Dumbbell Press", equipment: "Dumbbell", muscleGroups: ["Chest", "Front Delts", "Triceps"] },
  { id: "incline-machine-press", name: "Incline Machine Press", equipment: "Machine", muscleGroups: ["Upper Chest", "Front Delts", "Triceps"] },
  { id: "smith-machine-incline-press", name: "Smith Machine Incline Press", equipment: "Smith Machine", muscleGroups: ["Upper Chest", "Front Delts", "Triceps"] },
  { id: "low-to-high-cable-fly", name: "Low-to-High Cable Fly", equipment: "Cable", muscleGroups: ["Upper Chest"] },
  { id: "pec-deck", name: "Pec Deck", equipment: "Machine", muscleGroups: ["Chest"] },
  { id: "weighted-dip", name: "Weighted Dip", equipment: "Bodyweight", muscleGroups: ["Chest", "Triceps", "Front Delts"] },
  { id: "bodyweight-dip", name: "Bodyweight Dip", equipment: "Bodyweight", muscleGroups: ["Chest", "Triceps", "Front Delts"] },
  { id: "push-up", name: "Push-Up", equipment: "Bodyweight", muscleGroups: ["Chest", "Front Delts", "Triceps"] },
  { id: "deficit-push-up", name: "Deficit Push-Up", equipment: "Bodyweight", muscleGroups: ["Chest", "Front Delts", "Triceps"] },
  { id: "pull-up", name: "Pull-Up", equipment: "Bodyweight", muscleGroups: ["Lats", "Mid/Upper Back", "Biceps"] },
  { id: "chin-up", name: "Chin-Up", equipment: "Bodyweight", muscleGroups: ["Lats", "Biceps"] },
  { id: "assisted-pull-up", name: "Assisted Pull-Up", equipment: "Machine", muscleGroups: ["Lats", "Mid/Upper Back", "Biceps"] },
  { id: "lat-pulldown", name: "Lat Pulldown", equipment: "Cable", muscleGroups: ["Lats", "Biceps"] },
  { id: "single-arm-lat-pulldown", name: "Single-Arm Lat Pulldown", equipment: "Cable", muscleGroups: ["Lats", "Biceps"] },
  { id: "chest-supported-row", name: "Chest-Supported Row", equipment: "Machine", muscleGroups: ["Mid/Upper Back", "Lats", "Rear Delts", "Biceps"] },
  { id: "machine-row", name: "Machine Row", equipment: "Machine", muscleGroups: ["Mid/Upper Back", "Lats", "Biceps"] },
  { id: "single-arm-machine-row", name: "Single-Arm Machine Row", equipment: "Machine", muscleGroups: ["Lats", "Mid/Upper Back", "Biceps"] },
  { id: "single-arm-cable-row", name: "Single-Arm Cable Row", equipment: "Cable", muscleGroups: ["Lats", "Mid/Upper Back", "Biceps"] },
  { id: "barbell-row", name: "Barbell Row", equipment: "Barbell", muscleGroups: ["Mid/Upper Back", "Lats", "Lower Back"] },
  { id: "dumbbell-row", name: "Dumbbell Row", equipment: "Dumbbell", muscleGroups: ["Lats", "Mid/Upper Back", "Biceps"] },
  { id: "meadows-row", name: "Meadows Row", equipment: "Barbell", muscleGroups: ["Lats", "Mid/Upper Back", "Biceps"] },
  { id: "t-bar-row", name: "T-Bar Row", equipment: "Machine", muscleGroups: ["Mid/Upper Back", "Lats", "Biceps"] },
  { id: "rack-pull", name: "Rack Pull", equipment: "Barbell", muscleGroups: ["Lower Back", "Traps", "Glutes", "Hamstrings"] },
  { id: "back-extension", name: "Back Extension", equipment: "Bodyweight", muscleGroups: ["Lower Back", "Glutes", "Hamstrings"] },
  { id: "reverse-hyperextension", name: "Reverse Hyperextension", equipment: "Machine", muscleGroups: ["Lower Back", "Glutes", "Hamstrings"] },
  { id: "inverted-row", name: "Inverted Row", equipment: "Bodyweight", muscleGroups: ["Mid/Upper Back", "Lats", "Biceps"] },
  { id: "barbell-back-squat", name: "Barbell Back Squat", equipment: "Barbell", muscleGroups: ["Quads", "Glutes", "Hamstrings"] },
  { id: "front-squat", name: "Front Squat", equipment: "Barbell", muscleGroups: ["Quads", "Glutes", "Core"] },
  { id: "hack-squat", name: "Hack Squat", equipment: "Machine", muscleGroups: ["Quads", "Glutes"] },
  { id: "pendulum-squat", name: "Pendulum Squat", equipment: "Machine", muscleGroups: ["Quads", "Glutes"] },
  { id: "single-leg-leg-press", name: "Single-Leg Leg Press", equipment: "Machine", muscleGroups: ["Quads", "Glutes"] },
  { id: "smith-machine-squat", name: "Smith Machine Squat", equipment: "Smith Machine", muscleGroups: ["Quads", "Glutes"] },
  { id: "bulgarian-split-squat", name: "Bulgarian Split Squat", equipment: "Dumbbell", muscleGroups: ["Quads", "Glutes"] },
  { id: "walking-lunge", name: "Walking Lunge", equipment: "Dumbbell", muscleGroups: ["Quads", "Glutes", "Hamstrings"] },
  { id: "seated-leg-curl", name: "Seated Leg Curl", equipment: "Machine", muscleGroups: ["Hamstrings"] },
  { id: "lying-leg-curl", name: "Lying Leg Curl", equipment: "Machine", muscleGroups: ["Hamstrings"] },
  { id: "standing-single-leg-curl", name: "Standing Single-Leg Curl", equipment: "Machine", muscleGroups: ["Hamstrings"] },
  { id: "dumbbell-romanian-deadlift", name: "Dumbbell Romanian Deadlift", equipment: "Dumbbell", muscleGroups: ["Hamstrings", "Glutes", "Lower Back"] },
  { id: "stiff-leg-deadlift", name: "Stiff-Leg Deadlift", equipment: "Barbell", muscleGroups: ["Hamstrings", "Glutes", "Lower Back"] },
  { id: "hip-thrust", name: "Hip Thrust", equipment: "Barbell", muscleGroups: ["Glutes", "Hamstrings"] },
  { id: "glute-bridge", name: "Glute Bridge", equipment: "Barbell", muscleGroups: ["Glutes", "Hamstrings"] },
  { id: "nordic-hamstring-curl", name: "Nordic Hamstring Curl", equipment: "Bodyweight", muscleGroups: ["Hamstrings"] },
  { id: "seated-calf-raise", name: "Seated Calf Raise", equipment: "Machine", muscleGroups: ["Calves"] },
  { id: "calf-press", name: "Calf Press", equipment: "Machine", muscleGroups: ["Calves"] },
  { id: "dumbbell-shoulder-press", name: "Dumbbell Shoulder Press", equipment: "Dumbbell", muscleGroups: ["Front Delts", "Side Delts", "Triceps"] },
  { id: "smith-machine-shoulder-press", name: "Smith Machine Shoulder Press", equipment: "Smith Machine", muscleGroups: ["Front Delts", "Side Delts", "Triceps"] },
  { id: "seated-lateral-raise", name: "Seated Lateral Raise", equipment: "Dumbbell", muscleGroups: ["Side Delts"] },
  { id: "standing-lateral-raise", name: "Standing Lateral Raise", equipment: "Dumbbell", muscleGroups: ["Side Delts"] },
  { id: "single-arm-cable-lateral-raise", name: "Single-Arm Cable Lateral Raise", equipment: "Cable", muscleGroups: ["Side Delts"] },
  { id: "machine-lateral-raise", name: "Machine Lateral Raise", equipment: "Machine", muscleGroups: ["Side Delts"] },
  { id: "rear-delt-fly", name: "Rear Delt Fly", equipment: "Dumbbell", muscleGroups: ["Rear Delts"] },
  { id: "reverse-pec-deck", name: "Reverse Pec Deck", equipment: "Machine", muscleGroups: ["Rear Delts", "Mid/Upper Back"] },
  { id: "face-pull", name: "Face Pull", equipment: "Cable", muscleGroups: ["Rear Delts", "Traps"] },
  { id: "upright-row", name: "Upright Row", equipment: "Barbell", muscleGroups: ["Side Delts", "Traps"] },
  { id: "dumbbell-shrug", name: "Dumbbell Shrug", equipment: "Dumbbell", muscleGroups: ["Traps"] },
  { id: "machine-shrug", name: "Machine Shrug", equipment: "Machine", muscleGroups: ["Traps"] },
  { id: "dumbbell-curl", name: "Dumbbell Curl", equipment: "Dumbbell", muscleGroups: ["Biceps"] },
  { id: "single-arm-cable-curl", name: "Single-Arm Cable Curl", equipment: "Cable", muscleGroups: ["Biceps"] },
  { id: "preacher-curl", name: "Preacher Curl", equipment: "Barbell", muscleGroups: ["Biceps"] },
  { id: "machine-preacher-curl", name: "Machine Preacher Curl", equipment: "Machine", muscleGroups: ["Biceps"] },
  { id: "triceps-pushdown", name: "Triceps Pushdown", equipment: "Cable", muscleGroups: ["Triceps"] },
  { id: "single-arm-cable-pushdown", name: "Single-Arm Cable Pushdown", equipment: "Cable", muscleGroups: ["Triceps"] },
  { id: "skull-crusher", name: "Skull Crusher", equipment: "Barbell", muscleGroups: ["Triceps"] },
  { id: "close-grip-bench-press", name: "Close-Grip Bench Press", equipment: "Barbell", muscleGroups: ["Triceps", "Chest"] },
  { id: "machine-dip", name: "Machine Dip", equipment: "Machine", muscleGroups: ["Triceps", "Chest"] },
  { id: "bench-dip", name: "Bench Dip", equipment: "Bodyweight", muscleGroups: ["Triceps"] },
  { id: "wrist-curl", name: "Wrist Curl", equipment: "Dumbbell", muscleGroups: ["Forearms"] },
  { id: "reverse-curl", name: "Reverse Curl", equipment: "Barbell", muscleGroups: ["Forearms", "Biceps"] },
];

const placeholderTemplateSpecs = [
  {
    id: "back-and-biceps",
    name: "Back & Biceps",
    description: "5 exercises - Lats, upper back, and biceps",
    exercises: [
      ["Wide-Grip Lat Pulldown", 3],
      ["Seated Cable Row", 3],
      ["Chest-Supported T-Bar Row", 3],
      ["Barbell Curl", 3],
      ["Incline Dumbbell Curl", 3],
    ],
  },
  {
    id: "chest-and-triceps",
    name: "Chest & Triceps",
    description: "5 exercises - Pressing volume and triceps work",
    exercises: [
      ["Barbell Incline Bench Press", 3],
      ["Machine Chest Press", 3],
      ["Cable Fly (Mid)", 3],
      ["Cable Pushdown", 3],
      ["Overhead Cable Triceps Extension", 3],
    ],
  },
  {
    id: "leg-day",
    name: "Leg Day",
    description: "5 exercises - Quads, hamstrings, glutes, and calves",
    exercises: [
      ["Back Squat", 3],
      ["Romanian Deadlift", 3],
      ["Leg Press", 3],
      ["Leg Extension", 3],
      ["Standing Calf Raise", 3],
    ],
  },
  {
    id: "shoulders-and-arms",
    name: "Shoulders & Arms",
    description: "5 exercises - Delts, biceps, and triceps",
    exercises: [
      ["Machine Shoulder Press", 3],
      ["Cable Lateral Raise", 3],
      ["Cable Rear Delt Fly", 3],
      ["EZ-Bar Curl", 3],
      ["Rope Pushdown", 3],
    ],
  },
  {
    id: "push-day",
    name: "Push Day",
    description: "5 exercises - Chest, shoulders, and triceps",
    exercises: [
      ["Barbell Incline Bench Press", 3],
      ["Machine Chest Press", 3],
      ["Machine Shoulder Press", 3],
      ["Cable Lateral Raise", 3],
      ["Cable Pushdown", 3],
    ],
  },
  {
    id: "pull-day",
    name: "Pull Day",
    description: "5 exercises - Back thickness, width, and biceps",
    exercises: [
      ["Wide-Grip Lat Pulldown", 3],
      ["Barbell Bent-Over Row", 3],
      ["Seated Cable Row", 3],
      ["Chest-Supported Dumbbell Row", 3],
      ["Hammer Curl", 3],
    ],
  },
];

const dashboardRangeOptions = ["7 Days", "30 Days", "90 Days"];
const dashboardMetricConfigs = [
  {
    id: "calories",
    title: "Daily Calories Consumed",
    unit: "kcal",
    summaryLabel: "Avg",
    subtitle: "vs last 30 days",
    kind: "average",
  },
  {
    id: "bodyweight",
    title: "Bodyweight",
    unit: "lbs",
    summaryLabel: "Current",
    subtitle: "vs last 30 days",
    kind: "current",
  },
  {
    id: "sleep",
    title: "Hours of Sleep Per Night",
    unit: "hrs",
    summaryLabel: "Avg",
    subtitle: "vs last 30 days",
    kind: "average",
  },
];

const dashboardPlaceholderSeeds = {
  calories: {
    base: 2580,
    trend: 225,
    wave: [20, 85, 140, 120, 35, -110, -180, -210, -130, -15, 105, 98, 24, -62, -95, -40, 70, 210],
  },
  bodyweight: {
    base: 176.2,
    trend: 4.8,
    wave: [0, 0.4, 0.8, 1.2, 0.9, 0.5, 0.1, -0.2, 0.15, 0.55, 0.92, 1.25, 1.4, 1.55, 1.8, 2.1],
  },
  sleep: {
    base: 6.6,
    trend: 0.45,
    wave: [0.1, 0.32, 0.58, 0.46, 0.08, -0.2, -0.34, -0.18, 0.02, 0.28, 0.5, 0.42, 0.12, -0.14, 0.07, 0.36],
  },
};

const dashboardActionCards = [
  {
    id: "program",
    title: "My Program",
    subtitle: "View your training program and track progress",
    icon: "PR",
  },
  {
    id: "coach",
    title: "Ask Coach",
    subtitle: "Get personalized advice and expert guidance",
    icon: "AI",
  },
];

const settingsOptions = [
  {
    id: "account",
    title: "Account Settings",
    subtitle: "Manage sign-in and account details",
    badge: "AC",
    type: "account",
  },
  {
    id: "personal-info",
    title: "Personal Info",
    subtitle: "Update your profile, height, weight, and sex",
    badge: "PI",
    type: "profile",
  },
  {
    id: "food-tracking",
    title: "Configure Food Tracking",
    subtitle: "Adjust diary defaults and nutrition preferences",
    badge: "FD",
    type: "placeholder",
    message: "Food tracking settings are a placeholder for meal targets, units, and API preferences.",
  },
  {
    id: "workout-log",
    title: "Configure Workout Log",
    subtitle: "Tune workout logging behavior and defaults",
    badge: "WL",
    type: "placeholder",
    message: "Workout log settings are a placeholder for defaults, timers, and template behavior.",
  },
  {
    id: "coach-settings",
    title: "Coach Settings",
    subtitle: "Control coaching style and future AI features",
    badge: "CO",
    type: "placeholder",
    message: "Coach settings will eventually control guidance style, goals, and notification behavior.",
  },
  {
    id: "more",
    title: "More Settings",
    subtitle: "Additional app options and advanced preferences",
    badge: "MS",
    type: "placeholder",
    message: "More settings is a placeholder for advanced preferences and app diagnostics.",
  },
];

const defaultUserProfile = {
  firstName: "",
  height: "",
  weightLbs: "",
  sex: "",
  profilePhotoUri: "",
};

const storageKeys = {
  userProfile: "@dualfit:user-profile",
  userProfilePhoto: "@dualfit:user-profile-photo",
  foodDiaryByDate: "@dualfit:food-diary-by-date",
  checkIns: "@dualfit:check-ins",
  workoutTemplates: "@dualfit:workout-templates",
  trainingSplits: "@dualfit:training-splits",
  activeSplitId: "@dualfit:active-split-id",
  activeWorkout: "@dualfit:active-workout",
  completedWorkouts: "@dualfit:completed-workouts",
  favoriteFoods: "@dualfit:favorite-foods",
  customFoods: "@dualfit:custom-foods",
  customMeals: "@dualfit:custom-meals",
  authSession: "@dualfit:auth-session",
  cloudSyncMeta: "@dualfit:cloud-sync-meta",
  demoSeededAccounts: "@dualfit:demo-seeded-accounts",
};

const sanitizeProfileForStorage = (profile = {}) => ({
  firstName: String(profile?.firstName || ""),
  height: String(profile?.height || ""),
  weightLbs: String(profile?.weightLbs || ""),
  sex: String(profile?.sex || ""),
});

const inferImageExtension = (asset = {}) => {
  const mimeExtension = String(asset?.mimeType || "").split("/")[1] || "";
  if (mimeExtension) {
    return mimeExtension.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "jpg";
  }
  const uriExtension = String(asset?.uri || "").split(".").pop() || "";
  return uriExtension.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "jpg";
};

const inferImageMimeType = (asset = {}) => {
  const mimeType = String(asset?.mimeType || "").trim();
  if (mimeType) {
    return mimeType;
  }
  const extension = inferImageExtension(asset);
  if (extension === "png") {
    return "image/png";
  }
  if (extension === "webp") {
    return "image/webp";
  }
  return "image/jpeg";
};

const persistPickedImage = async (asset, { folderName = "misc", filePrefix = "image", scopeId = "local" } = {}) => {
  if (!asset?.uri) {
    throw new Error("No image selected.");
  }
  if (asset?.base64) {
    return `data:${inferImageMimeType(asset)};base64,${asset.base64}`;
  }
  const mediaDirectory = new Directory(Paths.document, "dualfit-media", folderName);
  mediaDirectory.create({ idempotent: true, intermediates: true });
  const extension = inferImageExtension(asset);
  const sourceFile = new File(asset.uri);
  if (!sourceFile.exists) {
    throw new Error("Selected image is unavailable.");
  }
  const targetFile = new File(
    mediaDirectory,
    `${filePrefix}-${String(scopeId || "local").replace(/[^a-zA-Z0-9-_]/g, "_")}-${Date.now()}.${extension}`
  );
  targetFile.create({ intermediates: true, overwrite: true });
  await sourceFile.copy(targetFile);
  return targetFile.uri;
};

const resolvePersistedImageUri = ({ folderName = "misc", filePrefix = "image", scopeId = "local", fallbackUri = "" } = {}) => {
  const normalizedFallback = String(fallbackUri || "");
  if (normalizedFallback) {
    return normalizedFallback;
  }
  const mediaDirectory = new Directory(Paths.document, "dualfit-media", folderName);
  if (!mediaDirectory.exists) {
    return "";
  }
  const normalizedScopeId = String(scopeId || "local").replace(/[^a-zA-Z0-9-_]/g, "_");
  const matchingFiles = mediaDirectory
    .list()
    .filter((entry) => entry instanceof File)
    .map((entry) => String(entry.uri || ""))
    .filter((uri) => uri.includes(`${filePrefix}-${normalizedScopeId}`))
    .sort((left, right) => right.localeCompare(left));
  return matchingFiles[0] || "";
};

const weekDayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekDayLabels = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const customSplitMuscleOptions = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Abs",
  "Traps",
  "Forearms",
];

const bodybuildingPresetTemplateSpecs = [
  {
    id: "preset-push-day",
    name: "Push Day",
    description: "6 exercises - Upper chest, shoulders, and triceps",
    exercises: [
      { name: "Incline Barbell Bench Press", defaultSets: 3, sets: [{ reps: "8-10", weight: "0" }, { reps: "8-10", weight: "0" }, { reps: "10-12", weight: "0" }] },
      { name: "Low Incline Dumbbell Press", defaultSets: 3, sets: [{ reps: "10", weight: "0" }, { reps: "10", weight: "0" }, { reps: "12", weight: "0" }] },
      { name: "Machine Shoulder Press", defaultSets: 3, sets: [{ reps: "8-10", weight: "0" }, { reps: "8-10", weight: "0" }, { reps: "10-12", weight: "0" }] },
      { name: "Machine Lateral Raise", defaultSets: 4, sets: [{ reps: "12-15", weight: "0" }, { reps: "12-15", weight: "0" }, { reps: "15", weight: "0" }, { reps: "15", weight: "0" }] },
      { name: "Cable Fly (Mid)", defaultSets: 3, sets: [{ reps: "12-15", weight: "0" }, { reps: "12-15", weight: "0" }, { reps: "15", weight: "0" }] },
      { name: "Rope Pushdown", defaultSets: 3, sets: [{ reps: "10-12", weight: "0" }, { reps: "10-12", weight: "0" }, { reps: "12-15", weight: "0" }] },
    ],
  },
  {
    id: "preset-pull-day",
    name: "Pull Day",
    description: "6 exercises - Lats, mid back, rear delts, and biceps",
    exercises: [
      { name: "Lat Pulldown", defaultSets: 3, sets: [{ reps: "8-10", weight: "0" }, { reps: "8-10", weight: "0" }, { reps: "10-12", weight: "0" }] },
      { name: "Chest-Supported Row", defaultSets: 3, sets: [{ reps: "8-10", weight: "0" }, { reps: "8-10", weight: "0" }, { reps: "10-12", weight: "0" }] },
      { name: "Single-Arm Cable Row", defaultSets: 3, sets: [{ reps: "10-12", weight: "0" }, { reps: "10-12", weight: "0" }, { reps: "12", weight: "0" }] },
      { name: "Reverse Pec Deck", defaultSets: 3, sets: [{ reps: "12-15", weight: "0" }, { reps: "12-15", weight: "0" }, { reps: "15", weight: "0" }] },
      { name: "Barbell Curl", defaultSets: 3, sets: [{ reps: "8-10", weight: "0" }, { reps: "8-10", weight: "0" }, { reps: "10-12", weight: "0" }] },
      { name: "Hammer Curl", defaultSets: 3, sets: [{ reps: "10-12", weight: "0" }, { reps: "10-12", weight: "0" }, { reps: "12", weight: "0" }] },
    ],
  },
  {
    id: "preset-leg-day",
    name: "Leg Day",
    description: "6 exercises - Quads, hamstrings, glutes, and calves",
    exercises: [
      { name: "Barbell Back Squat", defaultSets: 3, sets: [{ reps: "6-8", weight: "0" }, { reps: "8", weight: "0" }, { reps: "8-10", weight: "0" }] },
      { name: "Romanian Deadlift", defaultSets: 3, sets: [{ reps: "8-10", weight: "0" }, { reps: "8-10", weight: "0" }, { reps: "10", weight: "0" }] },
      { name: "Leg Press", defaultSets: 3, sets: [{ reps: "10-12", weight: "0" }, { reps: "10-12", weight: "0" }, { reps: "12", weight: "0" }] },
      { name: "Leg Extension", defaultSets: 3, sets: [{ reps: "12-15", weight: "0" }, { reps: "12-15", weight: "0" }, { reps: "15", weight: "0" }] },
      { name: "Seated Leg Curl", defaultSets: 3, sets: [{ reps: "10-12", weight: "0" }, { reps: "10-12", weight: "0" }, { reps: "12-15", weight: "0" }] },
      { name: "Standing Calf Raise", defaultSets: 4, sets: [{ reps: "10-12", weight: "0" }, { reps: "10-12", weight: "0" }, { reps: "12-15", weight: "0" }, { reps: "15", weight: "0" }] },
    ],
  },
  {
    id: "preset-quad-leg-day",
    name: "Quad-Focused Leg Day",
    description: "6 exercises - Squat pattern, quad isolation, and calves",
    exercises: [
      { name: "Pendulum Squat", defaultSets: 4, sets: [{ reps: "8-10", weight: "0" }, { reps: "8-10", weight: "0" }, { reps: "10", weight: "0" }, { reps: "12", weight: "0" }] },
      { name: "Hack Squat", defaultSets: 3, sets: [{ reps: "10", weight: "0" }, { reps: "10", weight: "0" }, { reps: "12", weight: "0" }] },
      { name: "Single-Leg Leg Press", defaultSets: 3, sets: [{ reps: "10-12", weight: "0" }, { reps: "10-12", weight: "0" }, { reps: "12", weight: "0" }] },
      { name: "Leg Extension", defaultSets: 4, sets: [{ reps: "12-15", weight: "0" }, { reps: "12-15", weight: "0" }, { reps: "15", weight: "0" }, { reps: "15-20", weight: "0" }] },
      { name: "Seated Leg Curl", defaultSets: 2, sets: [{ reps: "12", weight: "0" }, { reps: "12-15", weight: "0" }] },
      { name: "Calf Press", defaultSets: 4, sets: [{ reps: "12", weight: "0" }, { reps: "12", weight: "0" }, { reps: "15", weight: "0" }, { reps: "15", weight: "0" }] },
    ],
  },
  {
    id: "preset-hamstring-leg-day",
    name: "Hamstring-Focused Leg Day",
    description: "6 exercises - Hinges, curls, glutes, and calves",
    exercises: [
      { name: "Romanian Deadlift", defaultSets: 4, sets: [{ reps: "6-8", weight: "0" }, { reps: "8", weight: "0" }, { reps: "8-10", weight: "0" }, { reps: "10", weight: "0" }] },
      { name: "Lying Leg Curl", defaultSets: 4, sets: [{ reps: "10-12", weight: "0" }, { reps: "10-12", weight: "0" }, { reps: "12", weight: "0" }, { reps: "12-15", weight: "0" }] },
      { name: "Hip Thrust", defaultSets: 3, sets: [{ reps: "8-10", weight: "0" }, { reps: "8-10", weight: "0" }, { reps: "10-12", weight: "0" }] },
      { name: "Dumbbell Romanian Deadlift", defaultSets: 3, sets: [{ reps: "10", weight: "0" }, { reps: "10", weight: "0" }, { reps: "12", weight: "0" }] },
      { name: "Back Extension", defaultSets: 3, sets: [{ reps: "12-15", weight: "0" }, { reps: "12-15", weight: "0" }, { reps: "15", weight: "0" }] },
      { name: "Seated Calf Raise", defaultSets: 4, sets: [{ reps: "12", weight: "0" }, { reps: "12", weight: "0" }, { reps: "15", weight: "0" }, { reps: "15", weight: "0" }] },
    ],
  },
  {
    id: "preset-chest-day",
    name: "Chest Day",
    description: "6 exercises - Upper chest, flat press, fly work, and triceps",
    exercises: [["Incline Machine Press", 3], ["Barbell Bench Press", 3], ["Flat Dumbbell Press", 3], ["Low-to-High Cable Fly", 3], ["Pec Deck", 3], ["Overhead Cable Triceps Extension", 3]],
  },
  {
    id: "preset-shoulder-day",
    name: "Shoulder Day",
    description: "6 exercises - Side delts, rear delts, pressing, and traps",
    exercises: [["Dumbbell Shoulder Press", 3], ["Machine Lateral Raise", 4], ["Single-Arm Cable Lateral Raise", 3], ["Reverse Pec Deck", 3], ["Face Pull", 3], ["Dumbbell Shrug", 3]],
  },
  {
    id: "preset-arm-day",
    name: "Arm Day",
    description: "6 exercises - Biceps, triceps, and forearms",
    exercises: [["EZ-Bar Curl", 3], ["Incline Dumbbell Curl", 3], ["Machine Preacher Curl", 3], ["Close-Grip Bench Press", 3], ["Rope Pushdown", 3], ["Reverse Curl", 3]],
  },
  {
    id: "preset-lower-back-back-day",
    name: "Lower-Back-Focused Back Day",
    description: "6 exercises - Spinal erectors, hinges, rows, and lats",
    exercises: [["Rack Pull", 3], ["Barbell Row", 3], ["Back Extension", 3], ["Lat Pulldown", 3], ["Seated Cable Row", 3], ["Face Pull", 3]],
  },
  {
    id: "preset-upper-back-day",
    name: "Upper-Back-Focused Back Day",
    description: "6 exercises - Traps, rhomboids, rear delts, and rows",
    exercises: [["Chest-Supported Row", 3], ["T-Bar Row", 3], ["Wide-Grip Seated Cable Row", 3], ["Reverse Pec Deck", 3], ["Face Pull", 3], ["Machine Shrug", 3]],
  },
];
const customSplitMuscleAliases = {
  Chest: ["Upper Chest", "Mid/Lower Chest", "Chest"],
  Back: ["Lats", "Mid/Upper Back", "Lower Back", "Back"],
  Shoulders: ["Front Delts", "Side Delts", "Rear Delts", "Shoulders", "Delts"],
  Biceps: ["Biceps"],
  Triceps: ["Triceps"],
  Quads: ["Quads", "Quadriceps"],
  Hamstrings: ["Hamstrings", "Hams"],
  Glutes: ["Glutes"],
  Calves: ["Calves"],
  Abs: ["Abs", "Core", "Abdominals"],
  Traps: ["Traps", "Upper Traps"],
  Forearms: ["Forearms"],
};
const customSplitMuscleAbbreviations = {
  Triceps: "Tris",
  Biceps: "Bis",
  Shoulders: "Delts",
  Hamstrings: "Hams",
  Quads: "Quads",
};

const dashboardSeedBlueprints = [
  [
    { meal: "Breakfast", foodId: "oats", servingId: "half-cup", amount: 1.4 },
    { meal: "Breakfast", foodId: "whey", servingId: "scoop", amount: 1.2 },
    { meal: "Breakfast", foodId: "banana", servingId: "medium", amount: 1 },
    { meal: "Lunch", foodId: "chicken-rice-bowl", servingId: "serving", amount: 1.2 },
    { meal: "Dinner", foodId: "salmon", servingId: "fillet", amount: 1 },
    { meal: "Dinner", foodId: "oats", servingId: "half-cup", amount: 0.7 },
    { meal: "Snacks", foodId: "greek-yogurt", servingId: "container", amount: 1 },
  ],
  [
    { meal: "Breakfast", foodId: "greek-yogurt", servingId: "container", amount: 1.2 },
    { meal: "Breakfast", foodId: "banana", servingId: "medium", amount: 1 },
    { meal: "Lunch", foodId: "chicken-rice-bowl", servingId: "serving", amount: 1 },
    { meal: "Lunch", foodId: "whey", servingId: "scoop", amount: 1 },
    { meal: "Dinner", foodId: "salmon", servingId: "fillet", amount: 1.1 },
    { meal: "Snacks", foodId: "oats", servingId: "half-cup", amount: 1 },
  ],
  [
    { meal: "Breakfast", foodId: "oats", servingId: "half-cup", amount: 1.1 },
    { meal: "Breakfast", foodId: "greek-yogurt", servingId: "container", amount: 1 },
    { meal: "Lunch", foodId: "chicken-rice-bowl", servingId: "serving", amount: 1.35 },
    { meal: "Dinner", foodId: "salmon", servingId: "fillet", amount: 0.9 },
    { meal: "Dinner", foodId: "banana", servingId: "medium", amount: 1 },
    { meal: "Snacks", foodId: "whey", servingId: "scoop", amount: 1.4 },
  ],
  [
    { meal: "Breakfast", foodId: "whey", servingId: "scoop", amount: 1.5 },
    { meal: "Breakfast", foodId: "banana", servingId: "medium", amount: 1.5 },
    { meal: "Lunch", foodId: "chicken-rice-bowl", servingId: "serving", amount: 1.15 },
    { meal: "Dinner", foodId: "salmon", servingId: "fillet", amount: 1.2 },
    { meal: "Snacks", foodId: "greek-yogurt", servingId: "container", amount: 1 },
    { meal: "Snacks", foodId: "oats", servingId: "half-cup", amount: 0.8 },
  ],
  [
    { meal: "Breakfast", foodId: "greek-yogurt", servingId: "container", amount: 1 },
    { meal: "Breakfast", foodId: "oats", servingId: "half-cup", amount: 1.2 },
    { meal: "Lunch", foodId: "chicken-rice-bowl", servingId: "serving", amount: 1.1 },
    { meal: "Dinner", foodId: "salmon", servingId: "fillet", amount: 1.15 },
    { meal: "Dinner", foodId: "banana", servingId: "medium", amount: 1 },
    { meal: "Snacks", foodId: "whey", servingId: "two-scoops", amount: 1 },
  ],
];

const sleepPlaceholderByDateOffset = [6.6, 6.9, 7.2, 7.4, 7.1, 6.8, 6.5, 6.3, 6.4, 6.7, 7.0, 7.3, 7.4, 7.2, 6.9, 6.6, 6.5, 6.6, 6.8, 7.1, 7.4, 7.6, 7.5, 7.3, 7.0, 6.9, 7.2, 7.5, 7.4, 7.2];

const getSeedTargetCalories = (dayIndex, totalDays) => {
  const weeklyWave = Math.sin((dayIndex / 7) * Math.PI * 2) * 135;
  const monthlyWave = Math.cos((dayIndex / Math.max(totalDays, 30)) * Math.PI * 5.5) * 95;
  const drift = Math.sin((dayIndex / Math.max(totalDays, 30)) * Math.PI * 1.4) * 45;
  return Math.round(3050 + weeklyWave + monthlyWave + drift);
};

const getBlueprintCalories = (blueprint) =>
  blueprint.reduce((sum, item) => {
    const food = getSampleFoodById(item.foodId);
    if (!food) {
      return sum;
    }
    const serving = food.servings.find((entry) => entry.id === item.servingId) || food.servings[0];
    if (!serving) {
      return sum;
    }
    return sum + (toNumber(food.macros?.calories) * toNumber(serving.multiplier) * toNumber(item.amount));
  }, 0);

const emptyDiary = () =>
  mealOrder.reduce((accumulator, meal) => {
    accumulator[meal] = [];
    return accumulator;
  }, {});

const padDatePart = (value) => String(value).padStart(2, "0");

const getDateKey = (date = new Date()) =>
  `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;

const parseDateKey = (dateKey) => {
  const [year, month, day] = String(dateKey || "").split("-").map((value) => Number.parseInt(value, 10));
  return new Date(year, (month || 1) - 1, day || 1);
};

const shiftDateKey = (dateKey, offset) => {
  const nextDate = parseDateKey(dateKey);
  nextDate.setDate(nextDate.getDate() + offset);
  return getDateKey(nextDate);
};

const formatDateCaption = (dateKey) =>
  parseDateKey(dateKey).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const parseHeightParts = (heightValue) => {
  const rawValue = String(heightValue || "").trim().toLowerCase();
  const feetMatch = rawValue.match(/(\d+)\s*(?:'|ft|feet)/);
  const inchMatch = rawValue.match(/(?:'|ft|feet)\s*(\d+)|(\d+)\s*(?:"|in|inch|inches)/);
  const totalInchesMatch = rawValue.match(/^(\d{2,3})$/);
  const totalInches = totalInchesMatch ? Number(totalInchesMatch[1]) : null;
  const fallbackFeet = totalInches ? Math.floor(totalInches / 12) : 5;
  const fallbackInches = totalInches ? totalInches % 12 : 10;
  const feet = feetMatch ? Number(feetMatch[1]) : fallbackFeet;
  const inches = inchMatch ? Number(inchMatch[1] || inchMatch[2]) : fallbackInches;
  return {
    feet: Math.min(Math.max(Number.isFinite(feet) ? feet : 5, 3), 8),
    inches: Math.min(Math.max(Number.isFinite(inches) ? inches : 10, 0), 11),
  };
};

const formatHeightParts = (feet, inches) => `${feet}'${inches}"`;

const formatRelativeTimestamp = (timestamp) => {
  if (!timestamp) {
    return "";
  }

  const syncTime = new Date(timestamp);
  if (Number.isNaN(syncTime.getTime())) {
    return "";
  }

  const diffMs = Date.now() - syncTime.getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes < 1) {
    return "just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  return syncTime.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const getMostRecentTimestamp = (...values) => {
  const timestamps = values
    .flat()
    .map((value) => {
      if (!value) {
        return 0;
      }
      const parsed = new Date(value).getTime();
      return Number.isFinite(parsed) ? parsed : 0;
    })
    .filter((value) => value > 0);

  if (!timestamps.length) {
    return "";
  }

  return new Date(Math.max(...timestamps)).toISOString();
};

const getLatestRowTimestamp = (rows = []) =>
  getMostRecentTimestamp(
    rows.map(
      (row) =>
        row?.updated_at ||
        row?.created_at ||
        row?.completed_at ||
        row?.date_key ||
        row?.dateKey ||
        row?.recorded_at ||
        ""
    )
  );

const getRelativeDayLabel = (dateKey) => {
  const todayKey = getDateKey();
  if (dateKey === todayKey) {
    return "Today";
  }

  if (dateKey === shiftDateKey(todayKey, -1)) {
    return "Yesterday";
  }

  if (dateKey === shiftDateKey(todayKey, 1)) {
    return "Tomorrow";
  }

  return formatDateCaption(dateKey);
};

const formatValue = (value) => {
  const numeric = Number(value) || 0;
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1);
};

const formatCompactNumber = (value, digits = 0) => {
  const numeric = Number(value) || 0;
  return Number.isInteger(numeric) ? String(Math.round(numeric)) : numeric.toFixed(digits);
};

const toNumber = (value) => {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const getDashboardRangeDays = (rangeLabel) => Number.parseInt(String(rangeLabel || "30").split(" ")[0], 10) || 30;

const getDashboardNextRange = (currentRange) => {
  const currentIndex = dashboardRangeOptions.indexOf(currentRange);
  return dashboardRangeOptions[(currentIndex + 1) % dashboardRangeOptions.length];
};

const formatDashboardDateLabel = (dateKey) => {
  const label = parseDateKey(dateKey).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const [month, day] = label.split(" ");
  return `${String(month || "").toUpperCase()} ${day || ""}`.trim();
};

const getDateKeysForRange = (endDateKey, rangeDays) => {
  const keys = [];
  for (let offset = rangeDays - 1; offset >= 0; offset -= 1) {
    keys.push(shiftDateKey(endDateKey, -offset));
  }
  return keys;
};

const getCaloriesForDate = (foodDiaryByDate, dateKey) => {
  const diary = foodDiaryByDate?.[dateKey];
  if (!diary) {
    return 0;
  }
  return sumMacros(mealOrder.flatMap((meal) => diary[meal] || [])).calories;
};

const createSeedDiaryEntry = (foodId, servingId, amount, dateKey, entryIndex) => {
  const food = getSampleFoodById(foodId);
  if (!food) {
    return null;
  }

  return {
    ...createEntry(food, servingId, amount),
    id: `seed-${dateKey}-${foodId}-${entryIndex}`,
    source: "seed",
  };
};

const buildSeedFoodDiaryByDate = (endDateKey = getDateKey(), totalDays = 90) => {
  const seededDiary = {};

  for (let offset = totalDays - 1; offset >= 0; offset -= 1) {
    const dateKey = shiftDateKey(endDateKey, -offset);
    const dayIndex = totalDays - 1 - offset;
    const blueprint = dashboardSeedBlueprints[dayIndex % dashboardSeedBlueprints.length];
    const blueprintCalories = Math.max(getBlueprintCalories(blueprint), 1);
    const targetCalories = getSeedTargetCalories(dayIndex, totalDays);
    const planScale = targetCalories / blueprintCalories;
    const dayDiary = emptyDiary();

    blueprint.forEach((item, entryIndex) => {
      const amountJitter = 1 + ((((dayIndex + entryIndex) % 5) - 2) * 0.025);
      const entry = createSeedDiaryEntry(
        item.foodId,
        item.servingId,
        Number(Math.max(0.35, item.amount * planScale * amountJitter).toFixed(2)),
        dateKey,
        entryIndex
      );

      if (entry) {
        dayDiary[item.meal] = [...dayDiary[item.meal], entry];
      }
    });

    seededDiary[dateKey] = dayDiary;
  }

  return seededDiary;
};

const mergeDiaryWithSeed = (foodDiaryByDate = {}, endDateKey = getDateKey(), totalDays = 90) => {
  const seededDiary = buildSeedFoodDiaryByDate(endDateKey, totalDays);
  return {
    ...seededDiary,
    ...serializeFoodDiaryByDate(foodDiaryByDate),
  };
};

const serializeFoodDiaryByDate = (foodDiaryByDate = {}) =>
  Object.fromEntries(
    Object.entries(foodDiaryByDate).map(([dateKey, diary]) => [
      dateKey,
      Object.fromEntries(mealOrder.map((meal) => [meal, diary?.[meal] || []])),
    ])
  );

const normalizeCheckInEntry = (entry) => ({
  id: String(entry?.id || `check-in-${Date.now()}`),
  dateKey: String(entry?.dateKey || getDateKey()),
  createdAt: String(entry?.createdAt || new Date().toISOString()),
  weightLbs: toNumber(entry?.weightLbs),
  sleepHours: entry?.sleepHours == null ? null : toNumber(entry.sleepHours),
  photos: Array.isArray(entry?.photos)
    ? entry.photos.map((photo, index) => ({
        id: String(photo?.id || `${entry?.dateKey || getDateKey()}-photo-${index}`),
        uri: String(photo?.uri || photo?.photo_path || ""),
        type: photo?.type || photo?.photo_type || "other",
        createdAt: String(photo?.createdAt || photo?.created_at || new Date().toISOString()),
      })).filter((photo) => photo.uri)
    : [],
  notes: String(entry?.notes || ""),
});

const buildPlaceholderBodyweightSeries = (endDateKey, rangeDays) =>
  getDateKeysForRange(endDateKey, rangeDays).map((dateKey, index) => ({
    dateKey,
    label: formatDashboardDateLabel(dateKey),
    value: getPlaceholderDashboardValue("bodyweight", index, rangeDays),
  }));

const buildSleepPlaceholderSeries = (endDateKey, rangeDays) =>
  getDateKeysForRange(endDateKey, rangeDays).map((dateKey, index) => ({
    dateKey,
    label: formatDashboardDateLabel(dateKey),
    value: sleepPlaceholderByDateOffset[index % sleepPlaceholderByDateOffset.length],
  }));

const buildChartKitLabels = (series) => {
  if (series.length <= 3) {
    return series.map((point) => point.label);
  }

  return series.map((point, index) => {
    const lastIndex = series.length - 1;
    if (index === 0 || index === Math.round(lastIndex / 2) || index === lastIndex) {
      return point.label;
    }
    return "";
  });
};

const buildChartKitData = (series, metricId) => {
  const values = series.map((point) => toNumber(point.value));
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const spread = Math.max(maxValue - minValue, metricId === "calories" ? 120 : 1);
  const padding = metricId === "calories"
    ? 0
    : Math.max(0.35, spread * 0.22);
  const lowerBound = metricId === "calories"
    ? 0
    : minValue - padding;
  const upperBound = metricId === "calories"
    ? Math.max(500, Math.ceil((maxValue + 500) / 100) * 100)
    : maxValue + padding;
  const precision = metricId === "calories" ? 0 : 2;
  const hiddenColor = () => "rgba(0,0,0,0)";
  const makeGuideSeries = (value) => Array(values.length).fill(Number(value.toFixed(precision)));

  return {
    labels: buildChartKitLabels(series),
    datasets: [
      {
        data: values,
        color: () => theme.accent,
        strokeWidth: 3.5,
      },
      {
        data: makeGuideSeries(lowerBound),
        color: hiddenColor,
        strokeWidth: 0,
      },
      {
        data: makeGuideSeries(upperBound),
        color: hiddenColor,
        strokeWidth: 0,
      },
    ],
  };
};

const getPlaceholderDashboardValue = (metricId, index, totalPoints) => {
  const seed = dashboardPlaceholderSeeds[metricId] || dashboardPlaceholderSeeds.calories;
  const trendRatio = totalPoints > 1 ? index / (totalPoints - 1) : 0;
  const waveIndex = index % seed.wave.length;
  const seasonalOffset = seed.wave[waveIndex];

  return metricId === "bodyweight" || metricId === "sleep"
    ? Number((seed.base + (seed.trend * trendRatio) + seasonalOffset).toFixed(1))
    : Math.round(seed.base + (seed.trend * trendRatio) + seasonalOffset);
};

const buildDashboardSeries = ({ metricId, endDateKey, rangeLabel, foodDiaryByDate, checkIns }) => {
  const rangeDays = getDashboardRangeDays(rangeLabel);
  const keys = getDateKeysForRange(endDateKey, rangeDays);

  let rawSeries;
  if (metricId === "bodyweight") {
    const checkInMap = new Map((checkIns || []).map((entry) => [entry.dateKey, entry]));
    const placeholderSeries = buildPlaceholderBodyweightSeries(endDateKey, rangeDays);
    rawSeries = placeholderSeries.map((point) => {
      const checkIn = checkInMap.get(point.dateKey);
      return {
        ...point,
        value: checkIn?.weightLbs ? Number(checkIn.weightLbs.toFixed(1)) : point.value,
      };
    });
  } else if (metricId === "sleep") {
    const checkInMap = new Map((checkIns || []).map((entry) => [entry.dateKey, entry]));
    rawSeries = buildSleepPlaceholderSeries(endDateKey, rangeDays).map((point) => {
      const checkIn = checkInMap.get(point.dateKey);
      return {
        ...point,
        value: checkIn?.sleepHours ? Number(checkIn.sleepHours.toFixed(1)) : point.value,
      };
    });
  } else {
    rawSeries = keys.map((dateKey) => ({
      dateKey,
      label: formatDashboardDateLabel(dateKey),
      value: Number(getCaloriesForDate(foodDiaryByDate, dateKey).toFixed(0)),
    }));
  }

  return rawSeries;
};

const summarizeDashboardSeries = (metricId, series, summaryLabel, subtitle) => {
  if (!series.length) {
    return {
      summaryLabel,
      value: 0,
      trend: "+0",
      subtitle,
    };
  }

  const values = series.map((point) => toNumber(point.value));
  const latestValue = values[values.length - 1] || 0;
  const firstValue = values[0] || 0;
  const midpoint = Math.max(1, Math.floor(values.length / 2));
  const frontAverage = values.slice(0, midpoint).reduce((sum, value) => sum + value, 0) / midpoint;
  const backSlice = values.slice(midpoint);
  const backAverage = backSlice.reduce((sum, value) => sum + value, 0) / Math.max(backSlice.length, 1);
  const averageValue = values.reduce((sum, value) => sum + value, 0) / values.length;
  const delta = metricId === "bodyweight" ? latestValue - firstValue : backAverage - frontAverage;
  const deltaPrefix = delta >= 0 ? "+" : "";
  const digits = metricId === "calories" ? 0 : 1;

  return {
    summaryLabel,
    value: metricId === "bodyweight" ? latestValue : averageValue,
    trend: `${deltaPrefix}${formatCompactNumber(delta, digits)}`,
    subtitle,
  };
};

const buildDashboardMetrics = ({ foodDiaryByDate, endDateKey, rangeByMetric, checkIns }) =>
  dashboardMetricConfigs.map((config) => {
    const range = rangeByMetric[config.id] || "30 Days";
    const series = buildDashboardSeries({
      metricId: config.id,
      endDateKey,
      rangeLabel: range,
      foodDiaryByDate,
      checkIns,
    });
    const summary = summarizeDashboardSeries(config.id, series, config.summaryLabel, config.subtitle);

    return {
      ...config,
      range,
      data: series,
      value: summary.value,
      trend: summary.trend,
      subtitle: summary.subtitle,
      summaryLabel: summary.summaryLabel,
    };
  });

const getChartTickValues = (data) => {
  const values = data.map((point) => toNumber(point.displayValue ?? point.value));
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const spread = Math.max(maxValue - minValue, 1);
  const paddedMin = minValue - spread * 0.12;
  const paddedMax = maxValue + spread * 0.1;

  return Array.from({ length: 3 }, (_, index) => {
    const ratio = index / 2;
    return Number((paddedMax - ratio * (paddedMax - paddedMin)).toFixed(1));
  });
};

const buildChartPoints = (data, width, height, ticks) => {
  if (!data.length) {
    return [];
  }

  const minTick = Math.min(...ticks);
  const maxTick = Math.max(...ticks);
  const valueSpan = Math.max(maxTick - minTick, 1);

  return data.map((point, index) => ({
    ...point,
    x: data.length === 1 ? width / 2 : (index / (data.length - 1)) * width,
    y: height - ((toNumber(point.displayValue ?? point.value) - minTick) / valueSpan) * height,
  }));
};

const buildChartSegments = (points) =>
  points.slice(0, -1).map((point, index) => {
    const nextPoint = points[index + 1];
    const dx = nextPoint.x - point.x;
    const dy = nextPoint.y - point.y;
    return {
      id: `${point.dateKey}-${nextPoint.dateKey}`,
      left: point.x,
      top: point.y,
      width: Math.sqrt(dx * dx + dy * dy),
      angle: `${Math.atan2(dy, dx)}rad`,
    };
  });

const getChartLabelPoints = (points) => {
  if (points.length <= 3) {
    return points;
  }

  const indexes = [0, Math.round((points.length - 1) * 0.5), points.length - 1];
  return indexes.map((index) => points[index]).filter(Boolean);
};

function DashboardMetricCard({ metric, width, onCycleRange }) {
  const chartWidth = Math.max(width - 54, 240);
  const chartHeight = 184;
  const chartPadding = 14;
  const axisGutter = 48;
  const ticks = getChartTickValues(metric.data || []);
  const formatTickLabel = (value) => {
    if (metric.id === "calories") {
      return `${formatCompactNumber(value, 0)} kcal`;
    }
    if (metric.id === "sleep") {
      return `${formatCompactNumber(value, 1)} hrs`;
    }
    if (metric.id === "bodyweight") {
      return `${formatCompactNumber(value, 1)} ${metric.unit}`;
    }
    return `${formatCompactNumber(value, 1)} ${metric.unit}`.trim();
  };
  const points = buildChartPoints(metric.data || [], chartWidth - axisGutter - chartPadding * 2, chartHeight - chartPadding * 2, ticks)
    .map((point) => ({ ...point, x: point.x + chartPadding + axisGutter, y: point.y + chartPadding }));
  const linePath = points.reduce((path, point, index) => `${path}${index === 0 ? "M" : " L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`, "");

  return (
    <View style={[styles.dashboardChartCard, { width }]}>
      <View style={styles.dashboardChartGlow} />
      <View style={styles.dashboardRangeOrbWrap}>
        <Pressable onPress={onCycleRange} style={({ pressed }) => [styles.dashboardRangeButton, pressed && styles.darkPressablePressed]}>
          <Text style={styles.dashboardRangeButtonText}>{metric.range}</Text>
          <Text style={styles.dashboardRangeButtonCaret}>v</Text>
        </Pressable>
      </View>
      <View style={styles.dashboardChartHeader}>
        <View style={{ flex: 1, paddingRight: 112 }}>
          <Text style={styles.dashboardChartTitle}>{metric.title}</Text>
          <View style={styles.dashboardChartValueRow}>
            <Text style={styles.dashboardChartValue}>{formatCompactNumber(metric.value, metric.id === "calories" ? 0 : 1)}</Text>
            <Text style={styles.dashboardChartUnit}>{metric.unit}</Text>
          </View>
          <View style={styles.dashboardChartTrendRow}>
            <Text style={styles.dashboardChartTrend}>{metric.trend} {metric.unit}</Text>
            <Text style={styles.dashboardChartSubtitle}>{metric.subtitle}</Text>
          </View>
        </View>
      </View>

      <View style={styles.dashboardChartKitWrap}>
        <Text style={styles.dashboardChartAxisLabel}>{metric.unit}</Text>
        <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {ticks.map((tick, index) => {
            const y = chartPadding + ((chartHeight - chartPadding * 2) * (index / Math.max(ticks.length - 1, 1)));
            return (
              <React.Fragment key={`tick-${tick}-${index}`}>
                <Path
                  d={`M${chartPadding + axisGutter} ${y.toFixed(1)} H${(chartWidth - chartPadding).toFixed(1)}`}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />
                <SvgText
                  x={chartPadding + axisGutter - 8}
                  y={y + 4}
                  fill={theme.textSubtle}
                  fontSize="10"
                  fontWeight="700"
                  textAnchor="end"
                >
                  {formatTickLabel(tick)}
                </SvgText>
              </React.Fragment>
            );
          })}
          {linePath ? (
            <Path
              d={linePath}
              stroke={theme.accent}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ) : null}
          {points.length ? (
            <Circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="5" fill={theme.accent} />
          ) : null}
        </Svg>
      </View>
    </View>
  );
}

const PROGRAM_PREVIEW_GAP = 8;
const PROGRAM_PREVIEW_ROW_COUNTS = [3, 4];
const PROGRAM_PREVIEW_BLOCK_HEIGHT = 112;

const getProgramPreviewMetrics = (containerWidth) => {
  const safeWidth = Math.max(containerWidth || 0, 280);
  const maxColumns = Math.max(...PROGRAM_PREVIEW_ROW_COUNTS);
  const cardWidth = Math.max(
    Math.floor((safeWidth - (PROGRAM_PREVIEW_GAP * (maxColumns - 1))) / maxColumns),
    62
  );
  const rowWidths = PROGRAM_PREVIEW_ROW_COUNTS.map((count) => (cardWidth * count) + (PROGRAM_PREVIEW_GAP * (count - 1)));
  const maxRowWidth = Math.max(...rowWidths);
  const rowOffsets = rowWidths.map((width) => Math.max(0, (maxRowWidth - width) / 2));

  return {
    containerWidth: safeWidth,
    cardWidth,
    cardHeight: PROGRAM_PREVIEW_BLOCK_HEIGHT,
    rowOffsets,
    totalHeight: (PROGRAM_PREVIEW_BLOCK_HEIGHT * PROGRAM_PREVIEW_ROW_COUNTS.length) + (PROGRAM_PREVIEW_GAP * (PROGRAM_PREVIEW_ROW_COUNTS.length - 1)),
  };
};

const getProgramPreviewSlot = (index, metrics) => {
  let row = 0;
  let rowIndex = index;
  let seen = 0;
  for (let candidateRow = 0; candidateRow < PROGRAM_PREVIEW_ROW_COUNTS.length; candidateRow += 1) {
    const rowCount = PROGRAM_PREVIEW_ROW_COUNTS[candidateRow];
    if (index < seen + rowCount) {
      row = candidateRow;
      rowIndex = index - seen;
      break;
    }
    seen += rowCount;
  }
  const x = metrics.rowOffsets[row] + (rowIndex * (metrics.cardWidth + PROGRAM_PREVIEW_GAP));
  const y = row * (metrics.cardHeight + PROGRAM_PREVIEW_GAP);

  return {
    x,
    y,
    width: metrics.cardWidth,
    height: metrics.cardHeight,
  };
};

const getNearestProgramPreviewIndex = (centerX, centerY, metrics) => {
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < 7; index += 1) {
    const slot = getProgramPreviewSlot(index, metrics);
    const slotCenterX = slot.x + (slot.width / 2);
    const slotCenterY = slot.y + (slot.height / 2);
    const distance = Math.hypot(centerX - slotCenterX, centerY - slotCenterY);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  }

  return nearestIndex;
};

function ProgramScheduleDragGrid({ scheduledDays, workoutTemplates, onChange }) {
  const containerRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const [containerBounds, setContainerBounds] = useState({ width: 0, x: 0, y: 0 });
  const [dragState, setDragState] = useState(null);

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  }, []);

  const metrics = useMemo(
    () => getProgramPreviewMetrics(containerBounds.width),
    [containerBounds.width]
  );

  const updateMeasuredBounds = () => {
    if (!containerRef.current?.measureInWindow) {
      return;
    }
    containerRef.current.measureInWindow((x, y, width) => {
      setContainerBounds((current) => ({
        ...current,
        x,
        y,
        width: width || current.width,
      }));
    });
  };

  const beginDrag = (day, index, nativeEvent) => {
    updateMeasuredBounds();
    setDragState({
      id: day.id,
      hoverIndex: index,
      pageX: nativeEvent.pageX,
      pageY: nativeEvent.pageY,
      offsetX: nativeEvent.locationX,
      offsetY: nativeEvent.locationY,
    });
  };

  const endDrag = () => {
    if (!dragState) {
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDragState(null);
  };

  return (
    <View
      ref={containerRef}
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        setContainerBounds((current) => ({ ...current, width }));
        updateMeasuredBounds();
      }}
      style={[styles.programPreviewBoard, { height: metrics.totalHeight }]}
    >
      {(scheduledDays || []).map((day, index) => {
        const slot = getProgramPreviewSlot(index, metrics);
        const templateName = day.isRestDay
          ? "Rest"
          : (workoutTemplates.find((template) => template.id === day.workoutTemplateId)?.name || "Template");
        const isDragging = dragState?.id === day.id;
        const panResponder = PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: () => Boolean(isDragging),
          onPanResponderGrant: (event) => {
            updateMeasuredBounds();
            if (longPressTimerRef.current) {
              clearTimeout(longPressTimerRef.current);
            }
            const snapshot = { ...event.nativeEvent };
            longPressTimerRef.current = setTimeout(() => {
              beginDrag(day, index, snapshot);
            }, 180);
          },
          onPanResponderMove: (event) => {
            if (!isDragging) {
              return;
            }
            const pageX = event.nativeEvent.pageX;
            const pageY = event.nativeEvent.pageY;
            const nextLeft = pageX - containerBounds.x - dragState.offsetX;
            const nextTop = pageY - containerBounds.y - dragState.offsetY;
            const centerX = nextLeft + (metrics.cardWidth / 2);
            const centerY = nextTop + (metrics.cardHeight / 2);
            const nextIndex = getNearestProgramPreviewIndex(centerX, centerY, metrics);

            if (nextIndex !== dragState.hoverIndex) {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              onChange(reorderScheduledDay(scheduledDays, dragState.hoverIndex, nextIndex));
              setDragState((current) => current && current.id === day.id
                ? {
                  ...current,
                  hoverIndex: nextIndex,
                  pageX,
                  pageY,
                }
                : current);
              return;
            }

            setDragState((current) => current && current.id === day.id
              ? {
                ...current,
                pageX,
                pageY,
              }
              : current);
          },
          onPanResponderTerminationRequest: () => false,
          onPanResponderRelease: () => {
            if (longPressTimerRef.current) {
              clearTimeout(longPressTimerRef.current);
            }
            endDrag();
          },
          onPanResponderTerminate: () => {
            if (longPressTimerRef.current) {
              clearTimeout(longPressTimerRef.current);
            }
            endDrag();
          },
        });

        const floatingLeft = dragState
          ? dragState.pageX - containerBounds.x - dragState.offsetX
          : slot.x;
        const floatingTop = dragState
          ? dragState.pageY - containerBounds.y - dragState.offsetY
          : slot.y;

        return (
          <Animated.View
            key={day.id}
            {...panResponder.panHandlers}
            style={[
              styles.programPreviewBlock,
              day.isRestDay ? styles.programPreviewBlockRest : styles.programPreviewBlockTraining,
              {
                width: slot.width,
                height: slot.height,
                left: isDragging ? floatingLeft : slot.x,
                top: isDragging ? floatingTop : slot.y,
              },
              isDragging && styles.programPreviewBlockDragging,
            ]}
          >
            <View style={styles.programPreviewBlockHeader}>
              <Text style={styles.programPreviewBlockOrder}>Day {index + 1}</Text>
              <Text style={styles.programPreviewGrip}></Text>
            </View>
          <Text
            style={styles.programPreviewBlockLabel}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.68}
          >
            {day.label}
          </Text>
            <Text style={styles.programPreviewBlockMeta} numberOfLines={2}>{templateName}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const getSplitEditorDayOptions = (splitDraft, templates = []) => {
  const normalizedType = String(splitDraft?.splitType || "PPL").toUpperCase();
  const scheduledDays = Array.isArray(splitDraft?.scheduledDays) ? splitDraft.scheduledDays : [];
  const optionsMap = new Map();

  scheduledDays.forEach((day) => {
    if (!day || day.isRestDay) {
      return;
    }
    const template = day.workoutTemplateId
      ? templates.find((entry) => entry.id === day.workoutTemplateId) || null
      : getWorkoutTemplateForSplitLabel(day.label, templates) || null;
    const optionLabel = template?.name || day.label;
    const optionKey = template?.id ? `template-${template.id}` : `label-${String(optionLabel || "").toLowerCase()}`;
    if (!optionsMap.has(optionKey)) {
      optionsMap.set(optionKey, {
        key: optionKey,
        label: optionLabel,
        type: "training",
        workoutTemplateId: template?.id || day.workoutTemplateId || null,
      });
    }
  });

  if (!optionsMap.size) {
    const splitMap = {
      PPL: ["Push", "Pull", "Legs"],
      UL: ["Upper", "Lower"],
      FB: ["Full Body"],
    };

    (splitMap[normalizedType] || splitMap.PPL).forEach((label) => {
      const template = getWorkoutTemplateForSplitLabel(label, templates) || null;
      const optionKey = template?.id ? `template-${template.id}` : `label-${label.toLowerCase()}`;
      optionsMap.set(optionKey, {
        key: optionKey,
        label: template?.name || label,
        type: "training",
        workoutTemplateId: template?.id || null,
      });
    });
  }

  return [
    ...Array.from(optionsMap.values()),
    {
      key: "rest",
      label: "Rest",
      type: "rest",
      workoutTemplateId: null,
    },
  ];
};

function ProgramSchedulePreviewGrid({ scheduledDays, workoutTemplates, onChange, onOpenMenu }) {
  const containerRef = useRef(null);
  const [containerBounds, setContainerBounds] = useState({ width: 0, x: 0, y: 0 });

  const metrics = useMemo(
    () => getProgramPreviewMetrics(containerBounds.width),
    [containerBounds.width]
  );

  return (
    <View
      ref={containerRef}
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        setContainerBounds((current) => ({ ...current, width }));
      }}
      style={[styles.programPreviewBoard, { height: metrics.totalHeight }]}
    >
      {(scheduledDays || []).map((day, index) => {
        const slot = getProgramPreviewSlot(index, metrics);
        const templateName = day.isRestDay
          ? "Rest"
          : (workoutTemplates.find((template) => template.id === day.workoutTemplateId)?.name || "Template");

        return (
          <Pressable
            key={day.id}
            onPress={() => onOpenMenu?.(day, index)}
            style={({ pressed }) => [
              styles.programPreviewBlock,
              day.isRestDay ? styles.programPreviewBlockRest : styles.programPreviewBlockTraining,
              {
                width: slot.width,
                height: slot.height,
                left: slot.x,
                top: slot.y,
              },
              pressed && styles.programPreviewBlockPressed,
            ]}
          >
            <View style={styles.programPreviewBlockHeader}>
              <Text style={styles.programPreviewBlockOrder}>Day {index + 1}</Text>
              <Pressable
                onPress={() => onOpenMenu?.(day, index)}
                style={styles.programPreviewMenuButton}
                hitSlop={10}
              >
                <Text style={styles.programPreviewMenuButtonText}>...</Text>
              </Pressable>
            </View>
            <View style={styles.programPreviewDragSurface}>
              <Text
                style={styles.programPreviewBlockLabel}
                numberOfLines={2}
              >
                {day.label}
              </Text>
              <Text style={styles.programPreviewBlockMeta} numberOfLines={2}>{templateName}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const createEmptyMicros = () => ({});

const roundNutrientAmount = (amount) => Number(toNumber(amount).toFixed(2));

const normalizeMicroUnit = (unit) => {
  const normalized = String(unit || "").trim().toLowerCase();
  if (normalized === "?g" || normalized === "ug") {
    return "mcg";
  }
  if (normalized === "mcg") {
    return "mcg";
  }
  if (normalized === "milligram" || normalized === "milligrams") {
    return "mg";
  }
  if (normalized === "gram" || normalized === "grams") {
    return "g";
  }
  return normalized;
};

const convertNutrientUnit = (amount, fromUnit, toUnit) => {
  const sourceUnit = normalizeMicroUnit(fromUnit);
  const targetUnit = normalizeMicroUnit(toUnit);
  const numericAmount = toNumber(amount);

  if (!numericAmount || !sourceUnit || !targetUnit || sourceUnit === targetUnit) {
    return numericAmount;
  }

  const toMilligrams = {
    g: 1000,
    mg: 1,
    mcg: 0.001,
  };

  if (!(sourceUnit in toMilligrams) || !(targetUnit in toMilligrams)) {
    return Number.NaN;
  }

  const milligrams = numericAmount * toMilligrams[sourceUnit];
  return milligrams / toMilligrams[targetUnit];
};

const normalizeMicros = (micros = {}) =>
  micronutrientMeta.reduce((accumulator, nutrient) => {
    const entry = micros[nutrient.key];
    if (!entry) {
      return accumulator;
    }

    const convertedAmount = convertNutrientUnit(entry.amount, entry.unit || nutrient.unit, nutrient.unit);
    if (!Number.isFinite(convertedAmount) || convertedAmount <= 0) {
      return accumulator;
    }

    accumulator[nutrient.key] = {
      amount: roundNutrientAmount(convertedAmount),
      unit: nutrient.unit,
    };
    return accumulator;
  }, createEmptyMicros());

const scaleMicros = (micros = {}, multiplier = 1) =>
  normalizeMicros(
    Object.entries(micros).reduce((accumulator, [key, nutrient]) => {
      accumulator[key] = {
        amount: toNumber(nutrient?.amount) * multiplier,
        unit: nutrient?.unit || micronutrientMetaByKey[key]?.unit || "",
      };
      return accumulator;
    }, {})
  );

const sumMicros = (entries = []) =>
  entries.reduce((totals, entry) => {
    const micros = entry?.micros || {};
    Object.entries(micros).forEach(([key, nutrient]) => {
      const existing = totals[key] || { amount: 0, unit: nutrient.unit || micronutrientMetaByKey[key]?.unit || "" };
      totals[key] = {
        amount: roundNutrientAmount(existing.amount + toNumber(nutrient.amount)),
        unit: existing.unit || nutrient.unit || micronutrientMetaByKey[key]?.unit || "",
      };
    });
    return totals;
  }, createEmptyMicros());

const hasAnyMicros = (micros = {}) =>
  Object.values(micros || {}).some((nutrient) => toNumber(nutrient?.amount) > 0);

const normalizeNutrientName = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const mapFdcNutrientToKey = (nutrientName, nutrientNumber) => {
  const normalizedName = normalizeNutrientName(nutrientName);
  const normalizedNumber = String(nutrientNumber || "").trim();
  const match = micronutrientMeta.find((nutrient) =>
    nutrient.numbers.includes(normalizedNumber)
    || nutrient.names.some((name) => normalizedName === normalizeNutrientName(name) || normalizedName.includes(normalizeNutrientName(name)))
  );
  return match?.key || null;
};

const parseFdcMicros = (detailPayload) => {
  console.log("[FDC DETAIL]", detailPayload?.description || detailPayload?.name || detailPayload?.foodDescription || "FDC detail", detailPayload);
  const foodNutrients = Array.isArray(detailPayload?.foodNutrients) ? detailPayload.foodNutrients : [];

  const parsedMicros = normalizeMicros(
    foodNutrients.reduce((accumulator, nutrientEntry) => {
      const nutrientMeta = nutrientEntry?.nutrient || {};
      const nutrientName = nutrientMeta.name || nutrientEntry?.name || "";
      const nutrientNumber = nutrientMeta.number || nutrientEntry?.number || "";
      const nutrientKey = mapFdcNutrientToKey(nutrientName, nutrientNumber);
      if (!nutrientKey) {
        return accumulator;
      }

      const targetUnit = micronutrientMetaByKey[nutrientKey]?.unit || normalizeMicroUnit(nutrientEntry?.unitName || nutrientMeta?.unitName);
      const amount = toNumber(
        nutrientEntry?.amount ??
        nutrientEntry?.value ??
        nutrientEntry?.nutrientAmount
      );
      const unitName = nutrientEntry?.unitName || nutrientMeta?.unitName || targetUnit;
      const convertedAmount = convertNutrientUnit(amount, unitName, targetUnit);

      if (!Number.isFinite(convertedAmount) || convertedAmount <= 0) {
        return accumulator;
      }

      accumulator[nutrientKey] = {
        amount: roundNutrientAmount(convertedAmount),
        unit: targetUnit,
      };
      return accumulator;
    }, {})
  );

  console.log("[MICROS PER 100]", detailPayload?.description || detailPayload?.name || "FDC detail", parsedMicros);
  return parsedMicros;
};

const parseFatSecretMicrosFromServing = (serving) => normalizeMicros({
  fiber: { amount: toNumber(serving?.fiber), unit: "g" },
  sugar: { amount: toNumber(serving?.sugar), unit: "g" },
  saturatedFat: { amount: toNumber(serving?.saturated_fat), unit: "g" },
  cholesterol: { amount: toNumber(serving?.cholesterol), unit: "mg" },
  vitaminA: { amount: toNumber(serving?.vitamin_a), unit: "mcg" },
  vitaminC: { amount: toNumber(serving?.vitamin_c), unit: "mg" },
  vitaminD: { amount: toNumber(serving?.vitamin_d), unit: "mcg" },
  calcium: { amount: toNumber(serving?.calcium), unit: "mg" },
  iron: { amount: toNumber(serving?.iron), unit: "mg" },
  potassium: { amount: toNumber(serving?.potassium), unit: "mg" },
  sodium: { amount: toNumber(serving?.sodium), unit: "mg" },
});

const prominentMicronutrientKeys = ["fiber", "sugar", "potassium", "sodium", "calcium", "iron", "vitaminC"];

const formatNutrientAmount = (amount, unit) => `${formatValue(amount)} ${unit}`;

const getMicronutrientList = (micros = {}, preferredKeys = null) => {
  const orderedKeys = preferredKeys || micronutrientMeta.map((item) => item.key);
  return orderedKeys
    .map((key) => {
      const nutrient = micros[key];
      const meta = micronutrientMetaByKey[key];
      if (!meta || !nutrient || toNumber(nutrient.amount) <= 0) {
        return null;
      }

      return {
        key,
        label: meta.label,
        amount: nutrient.amount,
        unit: nutrient.unit || meta.unit,
        category: meta.category,
        target: meta.target,
      };
    })
    .filter(Boolean);
};

const levenshteinDistance = (left, right) => {
  const a = String(left || "").toLowerCase();
  const b = String(right || "").toLowerCase();

  if (!a) {
    return b.length;
  }

  if (!b) {
    return a.length;
  }

  const matrix = Array.from({ length: a.length + 1 }, (_, rowIndex) =>
    Array.from({ length: b.length + 1 }, (_, columnIndex) => {
      if (rowIndex === 0) {
        return columnIndex;
      }

      if (columnIndex === 0) {
        return rowIndex;
      }

      return 0;
    })
  );

  for (let row = 1; row <= a.length; row += 1) {
    for (let column = 1; column <= b.length; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
};

const buildFoodSearchHaystack = (food) =>
  [
    food?.name || "",
    food?.brand || "",
    food?.description || "",
    Array.isArray(food?.keywords) ? food.keywords.join(" ") : "",
  ]
    .join(" ")
    .toLowerCase();

const scoreFoodSearch = (food, query) => {
  const term = String(query || "").trim().toLowerCase();
  if (!term) {
    return 1;
  }

  const haystack = buildFoodSearchHaystack(food);
  const tokens = term.split(/\s+/).filter(Boolean);
  const normalizedHaystack = haystack.replace(/[^a-z0-9]+/g, "");
  const normalizedTerm = term.replace(/[^a-z0-9]+/g, "");
  const words = Array.from(
    new Set(
      haystack
        .split(/[^a-z0-9]+/)
        .map((word) => word.trim())
        .filter(Boolean)
    )
  );
  let score = 0;

  if (haystack.includes(term)) {
    score += 150;
  }

  if (normalizedTerm && normalizedHaystack.includes(normalizedTerm)) {
    score += 120;
  }

  tokens.forEach((token) => {
    if (haystack.includes(token)) {
      score += 36;
      return;
    }

    const closeWordDistance = words.reduce((best, word) => Math.min(best, levenshteinDistance(token, word)), Number.POSITIVE_INFINITY);
    const allowedDistance = token.length <= 4 ? 1 : token.length <= 7 ? 2 : 3;

    if (closeWordDistance <= allowedDistance) {
      score += 16 - (closeWordDistance * 3);
    }
  });

  if (tokens.length > 1) {
    const allTokensPresent = tokens.every((token) => haystack.includes(token));
    if (allTokensPresent) {
      score += 55;
    }
  }

  if (!score && normalizedTerm) {
    const compactWords = words.map((word) => word.replace(/[^a-z0-9]+/g, ""));
    const closeCompactDistance = compactWords.reduce(
      (best, word) => Math.min(best, levenshteinDistance(normalizedTerm, word)),
      Number.POSITIVE_INFINITY
    );
    const allowedDistance = normalizedTerm.length <= 5 ? 1 : normalizedTerm.length <= 8 ? 2 : 3;

    if (closeCompactDistance <= allowedDistance) {
      score += 12 - (closeCompactDistance * 2);
    }
  }

  return Math.max(score, 0);
};

const getRankedFoodMatches = (foods, query, limit = 20) => {
  const ranked = foods
    .map((food) => ({
      food,
      score: scoreFoodSearch(food, query),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || (left.food.name || "").localeCompare(right.food.name || ""))
    .slice(0, limit)
    .map((entry) => entry.food);

  return ranked;
};

const sampleFdcBananaDetail = {
  description: "Bananas, raw",
  foodNutrients: [
    { amount: 22.8, unitName: "g", nutrient: { number: "205", name: "Carbohydrate, by difference" } },
    { amount: 1.09, unitName: "g", nutrient: { number: "203", name: "Protein" } },
    { amount: 0.33, unitName: "g", nutrient: { number: "204", name: "Total lipid (fat)" } },
    { amount: 2.6, unitName: "g", nutrient: { number: "291", name: "Fiber, total dietary" } },
    { amount: 12.2, unitName: "g", nutrient: { number: "269", name: "Sugars, total including NLEA" } },
    { amount: 0.112, unitName: "g", nutrient: { number: "606", name: "Fatty acids, total saturated" } },
    { amount: 5, unitName: "mg", nutrient: { number: "601", name: "Cholesterol" } },
    { amount: 3, unitName: "mcg", nutrient: { number: "320", name: "Vitamin A, RAE" } },
    { amount: 8.7, unitName: "mg", nutrient: { number: "401", name: "Vitamin C, total ascorbic acid" } },
    { amount: 0, unitName: "mcg", nutrient: { number: "324", name: "Vitamin D (D2 + D3)" } },
    { amount: 0.1, unitName: "mg", nutrient: { number: "323", name: "Vitamin E (alpha-tocopherol)" } },
    { amount: 0.5, unitName: "mcg", nutrient: { number: "430", name: "Vitamin K (phylloquinone)" } },
    { amount: 0.031, unitName: "mg", nutrient: { number: "404", name: "Thiamin" } },
    { amount: 0.073, unitName: "mg", nutrient: { number: "405", name: "Riboflavin" } },
    { amount: 0.665, unitName: "mg", nutrient: { number: "406", name: "Niacin" } },
    { amount: 0.367, unitName: "mg", nutrient: { number: "415", name: "Vitamin B-6" } },
    { amount: 20, unitName: "mcg", nutrient: { number: "417", name: "Folate, total" } },
    { amount: 0, unitName: "mcg", nutrient: { number: "418", name: "Vitamin B-12" } },
    { amount: 9.8, unitName: "mg", nutrient: { number: "421", name: "Choline, total" } },
    { amount: 5, unitName: "mg", nutrient: { number: "301", name: "Calcium, Ca" } },
    { amount: 0.26, unitName: "mg", nutrient: { number: "303", name: "Iron, Fe" } },
    { amount: 27, unitName: "mg", nutrient: { number: "304", name: "Magnesium, Mg" } },
    { amount: 22, unitName: "mg", nutrient: { number: "305", name: "Phosphorus, P" } },
    { amount: 358, unitName: "mg", nutrient: { number: "306", name: "Potassium, K" } },
    { amount: 1, unitName: "mg", nutrient: { number: "307", name: "Sodium, Na" } },
    { amount: 0.15, unitName: "mg", nutrient: { number: "309", name: "Zinc, Zn" } },
    { amount: 0.078, unitName: "mg", nutrient: { number: "312", name: "Copper, Cu" } },
    { amount: 0.27, unitName: "mg", nutrient: { number: "315", name: "Manganese, Mn" } },
    { amount: 1, unitName: "mcg", nutrient: { number: "317", name: "Selenium, Se" } },
  ],
};

const sampleFdcBananaMicros = parseFdcMicros(sampleFdcBananaDetail);

const fdcSampleFoods = [
  {
    id: "fdc-bananas-raw",
    source: "fdc-sample",
    name: "Bananas, raw",
    brand: "USDA FDC Sample",
    description: "89 kcal | P 1.1g | C 22.8g | F 0.3g",
    keywords: ["banana", "bananas", "raw", "usda", "fdc", "potassium", "vitamin c"],
    micros: sampleFdcBananaMicros,
    servings: [
      {
        id: "fdc-bananas-raw-100g",
        label: "100 g",
        calories: 89,
        protein: 1.1,
        carbs: 22.8,
        fat: 0.3,
        micros: sampleFdcBananaMicros,
        metricAmount: 100,
        metricUnit: "g",
      },
      {
        id: "fdc-bananas-raw-1g",
        label: "1 g",
        calories: 0.89,
        protein: 0.01,
        carbs: 0.23,
        fat: 0,
        micros: scaleMicros(sampleFdcBananaMicros, 0.01),
        metricAmount: 1,
        metricUnit: "g",
      },
      {
        id: "fdc-bananas-raw-1oz",
        label: "1 oz",
        calories: 25.23,
        protein: 0.31,
        carbs: 6.46,
        fat: 0.09,
        micros: scaleMicros(sampleFdcBananaMicros, 0.283495),
        metricAmount: 28.3495,
        metricUnit: "g",
      },
      {
        id: "fdc-bananas-raw-medium",
        label: "1 medium banana",
        calories: 105,
        protein: 1.3,
        carbs: 26.9,
        fat: 0.4,
        micros: scaleMicros(sampleFdcBananaMicros, 1.18),
        metricAmount: 118,
        metricUnit: "g",
      },
    ],
    macros: { calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3 },
  },
];

const localFoodLibrary = [...foodLibrary, ...fdcSampleFoods];

const extractHostFromUrlLike = (value) => {
  const source = String(value || "").trim();
  if (!source) {
    return "";
  }

  const fullMatch = source.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\/([^/:]+)/);
  if (fullMatch?.[1]) {
    return fullMatch[1];
  }

  const hostUriMatch = source.match(/^([^/:]+):\d+/);
  if (hostUriMatch?.[1]) {
    return hostUriMatch[1];
  }

  return "";
};

const getFatSecretApiBaseUrl = () => {
  const configuredProxyUrl = process.env.EXPO_PUBLIC_FATSECRET_PROXY_URL || "";
  if (configuredProxyUrl) {
    return configuredProxyUrl.replace(/\/$/, "");
  }

  const hostCandidates = [
    extractHostFromUrlLike(Constants.expoConfig?.hostUri),
    extractHostFromUrlLike(Constants.linkingUri),
    extractHostFromUrlLike(NativeModules?.SourceCode?.scriptURL),
  ].filter(Boolean);

  const host = hostCandidates[0] || "localhost";
  const baseUrl = `http://${host}:${FATSECRET_PROXY_PORT}/api/fatsecret`;
  console.log("[FATSECRET] resolved proxy base", baseUrl, {
    hostCandidates,
    hostUri: Constants.expoConfig?.hostUri || "",
    linkingUri: Constants.linkingUri || "",
    scriptURL: NativeModules?.SourceCode?.scriptURL || "",
  });
  return baseUrl;
};

const getLocalApiServerBaseUrl = () => {
  const configuredProxyUrl = process.env.EXPO_PUBLIC_FATSECRET_PROXY_URL || "";
  if (configuredProxyUrl) {
    return configuredProxyUrl.replace(/\/api\/fatsecret\/?$/, "").replace(/\/$/, "");
  }

  return getFatSecretApiBaseUrl().replace(/\/api\/fatsecret\/?$/, "");
};

const searchLocalFoods = (query) => {
  const term = String(query || "").trim().toLowerCase();
  const list = !term
    ? []
    : getRankedFoodMatches(localFoodLibrary, term, 20);

  return {
    provider: "sample",
    providerLabel: "DualFit Suggestions",
    setupMessage: "FS Food Data is unavailable right now. Showing local foods and samples instead.",
    results: list.map((food) => ({
      id: food.id,
      source: "sample",
      name: food.name,
      brand: food.brand || "",
      description: `${formatValue(food.macros.calories)} kcal | P ${formatValue(food.macros.protein)}g | C ${formatValue(food.macros.carbs)}g | F ${formatValue(food.macros.fat)}g`,
      servingLabel: food.servings?.[0]?.label || "1 serving",
      macros: {
        calories: food.macros.calories,
        protein: food.macros.protein,
        carbs: food.macros.carbs,
        fat: food.macros.fat,
      },
    })),
  };
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = FATSECRET_REQUEST_TIMEOUT_MS, timeoutMessage = "Request timed out.") => {
  const timeoutController = new AbortController();
  const externalSignal = options.signal;
  let externalAbortHandler = null;

  if (externalSignal) {
    if (externalSignal.aborted) {
      timeoutController.abort();
    } else {
      externalAbortHandler = () => timeoutController.abort();
      externalSignal.addEventListener("abort", externalAbortHandler, { once: true });
    }
  }

  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: timeoutController.signal,
    });
  } catch (error) {
    if (timeoutController.signal.aborted) {
      const abortError = new Error(timeoutMessage);
      abortError.name = "AbortError";
      throw abortError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal && externalAbortHandler) {
      externalSignal.removeEventListener("abort", externalAbortHandler);
    }
  }
};

const searchFoodsFromProxy = async (query, signal) => {
  const response = await fetchWithTimeout(
    `${getFatSecretApiBaseUrl()}/search?q=${encodeURIComponent(query)}`,
    { signal },
    FATSECRET_REQUEST_TIMEOUT_MS,
    "FS Food Data search timed out."
  );
  if (!response.ok) {
    throw new Error(`Food search failed (${response.status})`);
  }

  const payload = await response.json();
  return {
    provider: payload.provider || "fatsecret",
    providerLabel: payload.provider === "fatsecret" ? "FS Food Data" : "DualFit Suggestions",
    setupMessage: payload.message || DEFAULT_SEARCH_MESSAGE,
    results: Array.isArray(payload.results) ? payload.results : [],
  };
};

const mergeSearchResults = (primaryResults, fallbackResults, limit = 20, query = "") => {
  const seen = new Set();
  const merged = [];
  const normalizedQuery = String(query || "").trim().toLowerCase();
  const isSimpleGenericQuery = normalizedQuery && /^[a-z\s-]+$/.test(normalizedQuery) && normalizedQuery.split(/\s+/).filter(Boolean).length <= 2;
  const looksBrandedQuery = /\d/.test(normalizedQuery) || /\b(protein|bar|cereal|chips|cookie|whey|fairlife|quest|gatorade|coke|pepsi)\b/.test(normalizedQuery);

  [...primaryResults, ...fallbackResults].forEach((food) => {
    const key = `${String(food.name || "").toLowerCase()}:${String(food.brand || "").toLowerCase()}`;
    if (seen.has(key) || merged.length >= limit) {
      return;
    }

    seen.add(key);
    merged.push(food);
  });

  const getFoodPriority = (food) => {
    const source = String(food.source || "").toLowerCase();
    const brand = String(food.brand || "").trim().toLowerCase();
    const isGeneric = source.includes("generic") || ["produce", "generic"].includes(brand) || !brand;
    const isBranded = Boolean(brand && !["sample food", "ingredient", "logged meal", "generic", "produce"].includes(brand));

    if (looksBrandedQuery) {
      if (isBranded) {
        return 1;
      }
      if (isGeneric) {
        return 2;
      }
      if (source === "fatsecret") {
        return 3;
      }
    }

    if (isSimpleGenericQuery) {
      if (isGeneric) {
        return 1;
      }
      if (isBranded) {
        return 2;
      }
      if (source === "fatsecret") {
        return 3;
      }
    }

    if (isBranded) {
      return 1;
    }
    if (isGeneric) {
      return 2;
    }
    if (source === "fatsecret") {
      return 3;
    }
    return 4;
  };

  return merged
    .sort((left, right) => {
      const priorityDelta = getFoodPriority(left) - getFoodPriority(right);
      if (priorityDelta !== 0) {
        return priorityDelta;
      }
      return String(left.name || "").localeCompare(String(right.name || ""));
    })
    .slice(0, limit);
};

const normalizeFatSecretFood = (foodPayload) => {
  const food = foodPayload?.food;
  const servings = Array.isArray(food?.servings?.serving)
    ? food.servings.serving
    : food?.servings?.serving
      ? [food.servings.serving]
      : [];
  const foodMicros = food?.foodNutrients
    ? parseFdcMicros(food)
    : normalizeMicros(
        servings.reduce((accumulator, serving) => {
          const servingMicros = parseFatSecretMicrosFromServing(serving);
          Object.entries(servingMicros).forEach(([key, nutrient]) => {
            if (!accumulator[key] && toNumber(nutrient.amount) > 0) {
              accumulator[key] = nutrient;
            }
          });
          return accumulator;
        }, {})
      );

  return {
    id: String(food?.food_id || ""),
    source: "fatsecret",
    name: food?.food_name || "Food",
    brand: food?.brand_name || "",
    description: food?.food_description || "",
    micros: foodMicros,
    servings: augmentStandardizedMetricServings(
      servings.map((serving) => ({
        id: String(serving.serving_id || serving.serving_description || Math.random()),
        label: serving.serving_description || serving.measurement_description || "Serving",
        calories: toNumber(serving.calories),
        protein: toNumber(serving.protein),
        carbs: toNumber(serving.carbohydrate),
        fat: toNumber(serving.fat),
        micros: serving?.foodNutrients ? parseFdcMicros(serving) : parseFatSecretMicrosFromServing(serving),
        metricAmount: toNumber(serving.metric_serving_amount),
        metricUnit: String(serving.metric_serving_unit || "").toLowerCase(),
      }))
    ),
  };
};

const fetchFoodDetailFromProxy = async (foodId, signal) => {
  const response = await fetchWithTimeout(
    `${getFatSecretApiBaseUrl()}/food/${encodeURIComponent(foodId)}`,
    { signal },
    5000,
    "FS Food Data detail timed out."
  );
  if (!response.ok) {
    throw new Error(`Food detail failed (${response.status})`);
  }

  const payload = await response.json();
  return normalizeFatSecretFood(payload);
};

const buildOffServing = (product) => {
  const nutriments = product?.nutriments || {};
  const servingQuantity = toNumber(product?.serving_quantity);
  const servingLabel = product?.serving_size || (servingQuantity ? `${formatValue(servingQuantity)} g` : "1 serving");
  const calories100g = toNumber(
    nutriments["energy-kcal_100g"] ??
      nutriments["energy-kcal"] ??
      nutriments.energy_kcal_100g ??
      nutriments.energy_kcal
  );
  const protein100g = toNumber(nutriments.proteins_100g ?? nutriments.proteins);
  const carbs100g = toNumber(nutriments.carbohydrates_100g ?? nutriments.carbohydrates);
  const fat100g = toNumber(nutriments.fat_100g ?? nutriments.fat);
  const microsPer100 = normalizeMicros({
    fiber: { amount: toNumber(nutriments.fiber_100g ?? nutriments.fiber), unit: "g" },
    sugar: { amount: toNumber(nutriments.sugars_100g ?? nutriments.sugars), unit: "g" },
    saturatedFat: { amount: toNumber(nutriments["saturated-fat_100g"] ?? nutriments.saturated_fat_100g ?? nutriments["saturated-fat"]), unit: "g" },
    cholesterol: { amount: toNumber(nutriments.cholesterol_100g ?? nutriments.cholesterol), unit: "mg" },
    vitaminA: { amount: toNumber(nutriments["vitamin-a_100g"] ?? nutriments.vitamin_a_100g ?? nutriments["vitamin-a"]), unit: "mcg" },
    vitaminC: { amount: toNumber(nutriments["vitamin-c_100g"] ?? nutriments.vitamin_c_100g ?? nutriments["vitamin-c"]), unit: "mg" },
    vitaminD: { amount: toNumber(nutriments["vitamin-d_100g"] ?? nutriments.vitamin_d_100g ?? nutriments["vitamin-d"]), unit: "mcg" },
    vitaminE: { amount: toNumber(nutriments["vitamin-e_100g"] ?? nutriments.vitamin_e_100g ?? nutriments["vitamin-e"]), unit: "mg" },
    vitaminK: { amount: toNumber(nutriments["vitamin-k_100g"] ?? nutriments.vitamin_k_100g ?? nutriments["vitamin-k"]), unit: "mcg" },
    calcium: { amount: toNumber(nutriments.calcium_100g ?? nutriments.calcium), unit: "mg" },
    iron: { amount: toNumber(nutriments.iron_100g ?? nutriments.iron), unit: "mg" },
    magnesium: { amount: toNumber(nutriments.magnesium_100g ?? nutriments.magnesium), unit: "mg" },
    phosphorus: { amount: toNumber(nutriments.phosphorus_100g ?? nutriments.phosphorus), unit: "mg" },
    potassium: { amount: toNumber(nutriments.potassium_100g ?? nutriments.potassium), unit: "mg" },
    sodium: { amount: toNumber(nutriments.sodium_100g ?? nutriments.sodium), unit: "mg" },
    zinc: { amount: toNumber(nutriments.zinc_100g ?? nutriments.zinc), unit: "mg" },
    copper: { amount: toNumber(nutriments.copper_100g ?? nutriments.copper), unit: "mg" },
    manganese: { amount: toNumber(nutriments.manganese_100g ?? nutriments.manganese), unit: "mg" },
    selenium: { amount: toNumber(nutriments.selenium_100g ?? nutriments.selenium), unit: "mcg" },
  });
  const grams = servingQuantity || 100;
  const multiplier = grams / 100;

  return {
    id: product?.code || "openfoodfacts-serving",
    label: servingLabel,
    calories: Number((calories100g * multiplier).toFixed(1)),
    protein: Number((protein100g * multiplier).toFixed(1)),
    carbs: Number((carbs100g * multiplier).toFixed(1)),
    fat: Number((fat100g * multiplier).toFixed(1)),
    micros: scaleMicros(microsPer100, multiplier),
  };
};

const normalizeOpenFoodFactsProduct = (payload) => {
  const product = payload?.product;
  if (!product) {
    return null;
  }

  const defaultServing = buildOffServing(product);
  const offMicrosPer100 = normalizeMicros({
    fiber: { amount: toNumber(product?.nutriments?.fiber_100g), unit: "g" },
    sugar: { amount: toNumber(product?.nutriments?.sugars_100g), unit: "g" },
    saturatedFat: { amount: toNumber(product?.nutriments?.["saturated-fat_100g"] ?? product?.nutriments?.saturated_fat_100g), unit: "g" },
    cholesterol: { amount: toNumber(product?.nutriments?.cholesterol_100g), unit: "mg" },
    vitaminA: { amount: toNumber(product?.nutriments?.["vitamin-a_100g"] ?? product?.nutriments?.vitamin_a_100g), unit: "mcg" },
    vitaminC: { amount: toNumber(product?.nutriments?.["vitamin-c_100g"] ?? product?.nutriments?.vitamin_c_100g), unit: "mg" },
    calcium: { amount: toNumber(product?.nutriments?.calcium_100g), unit: "mg" },
    iron: { amount: toNumber(product?.nutriments?.iron_100g), unit: "mg" },
    potassium: { amount: toNumber(product?.nutriments?.potassium_100g), unit: "mg" },
    sodium: { amount: toNumber(product?.nutriments?.sodium_100g), unit: "mg" },
  });
  return {
    id: String(product.code || product.id || `off-${Date.now()}`),
    source: "openfoodfacts",
    name: product.product_name || product.generic_name || "Scanned product",
    brand: product.brands || "Open Food Facts",
    description: product.quantity || product.categories || "",
    keywords: [
      product.brands || "",
      product.product_name || "",
      product.generic_name || "",
      product.categories || "",
    ]
      .join(" ")
      .split(/[, ]+/)
      .filter(Boolean),
    micros: offMicrosPer100,
    servings: augmentStandardizedMetricServings([
      {
        ...defaultServing,
        metricAmount: toNumber(product?.serving_quantity) || 0,
        metricUnit: /ml/i.test(product?.serving_size || "") ? "ml" : "g",
      },
      {
        id: `${product.code || "openfoodfacts"}-100g`,
        label: "100 g",
        calories: Number(toNumber(product?.nutriments?.["energy-kcal_100g"] ?? product?.nutriments?.energy_kcal_100g).toFixed(1)),
        protein: Number(toNumber(product?.nutriments?.proteins_100g).toFixed(1)),
        carbs: Number(toNumber(product?.nutriments?.carbohydrates_100g).toFixed(1)),
        fat: Number(toNumber(product?.nutriments?.fat_100g).toFixed(1)),
        micros: offMicrosPer100,
        metricAmount: 100,
        metricUnit: "g",
      },
      ...(toNumber(product?.nutriments?.["energy-kcal_100ml"] ?? product?.nutriments?.energy_kcal_100ml) > 0
        ? [{
            id: `${product.code || "openfoodfacts"}-100ml`,
            label: "100 ml",
            calories: Number(toNumber(product?.nutriments?.["energy-kcal_100ml"] ?? product?.nutriments?.energy_kcal_100ml).toFixed(1)),
            protein: Number(toNumber(product?.nutriments?.proteins_100ml).toFixed(1)),
            carbs: Number(toNumber(product?.nutriments?.carbohydrates_100ml).toFixed(1)),
            fat: Number(toNumber(product?.nutriments?.fat_100ml).toFixed(1)),
            micros: scaleMicros(offMicrosPer100, 1),
            metricAmount: 100,
            metricUnit: "ml",
          }]
        : []),
    ]),
  };
};

const fetchFoodFromBarcode = async (barcode) => {
  const barcodeValue = String(barcode || "").trim();
  if (!barcodeValue) {
    throw new Error("Barcode is missing.");
  }

  const cachedFood = barcodeFoodCache.get(barcodeValue);
  if (cachedFood) {
    return cachedFood;
  }

  let proxyError = null;
  try {
    const proxyResponse = await fetchWithTimeout(
      `${getLocalApiServerBaseUrl()}/api/barcode/${encodeURIComponent(barcodeValue)}`,
      {},
      BARCODE_PROXY_TIMEOUT_MS,
      "Barcode proxy lookup timed out."
    );
    if (!proxyResponse.ok) {
      throw new Error(`Barcode lookup failed (${proxyResponse.status})`);
    }

    const payload = await proxyResponse.json();
    if (payload.status !== 1 || !payload.product) {
      throw new Error("No barcode match found.");
    }

    const normalized = normalizeOpenFoodFactsProduct(payload);
    if (!normalized) {
      throw new Error("Scanned product data is incomplete.");
    }

    barcodeFoodCache.set(barcodeValue, normalized);
    return normalized;
  } catch (lookupProxyError) {
    proxyError = lookupProxyError;

    try {
      const response = await fetchWithTimeout(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcodeValue)}.json?fields=code,status,status_verbose,id,product_name,generic_name,brands,quantity,categories,serving_size,serving_quantity,nutriments`,
        {},
        BARCODE_DIRECT_TIMEOUT_MS,
        "Barcode fallback lookup timed out."
      );
      if (!response.ok) {
        throw new Error(`Barcode lookup failed (${response.status})`);
      }

      const payload = await response.json();
      if (payload.status !== 1 || !payload.product) {
        throw new Error("No barcode match found.");
      }

      const normalized = normalizeOpenFoodFactsProduct(payload);
      if (!normalized) {
        throw new Error("Scanned product data is incomplete.");
      }

      barcodeFoodCache.set(barcodeValue, normalized);
      return normalized;
    } catch (fallbackError) {
      logAppError({
        source: "barcode",
        action: "lookup",
        userMessage: "Barcode lookup failed.",
        error: fallbackError,
        details: {
          barcode: barcodeValue,
          proxyBaseUrl: getLocalApiServerBaseUrl(),
          proxyError: proxyError?.message || String(proxyError || ""),
        },
      });
      throw fallbackError;
    }
  }
};

const getSampleFoodById = (foodId) => localFoodLibrary.find((food) => food.id === foodId) || null;

const findStandardMetricBasisServing = (servings) =>
  servings.find((serving) => {
    const amount = toNumber(serving.metricAmount);
    const unit = String(serving.metricUnit || "").toLowerCase();
    const label = String(serving.label || "").toLowerCase();
    return (amount === 100 && (unit === "g" || unit === "gram" || unit === "grams" || unit === "ml"))
      || /^100\s?(g|gram|grams|ml)\b/.test(label);
  }) || null;

const servingExists = (servings, label) =>
  servings.some((serving) => String(serving.label || "").toLowerCase() === String(label).toLowerCase());

const scaleServing = (basisServing, amount, unit, idSuffix, label) => {
  const ratio = amount / 100;
  return {
    id: `${basisServing.id}-${idSuffix}`,
    label,
    calories: Number((toNumber(basisServing.calories) * ratio).toFixed(2)),
    protein: Number((toNumber(basisServing.protein) * ratio).toFixed(2)),
    carbs: Number((toNumber(basisServing.carbs) * ratio).toFixed(2)),
    fat: Number((toNumber(basisServing.fat) * ratio).toFixed(2)),
    micros: scaleMicros(basisServing.micros, ratio),
    metricAmount: amount,
    metricUnit: unit,
  };
};

const augmentStandardizedMetricServings = (servings) => {
  const normalizedServings = Array.isArray(servings) ? servings.filter(Boolean) : [];
  const basisServing = findStandardMetricBasisServing(normalizedServings);
  if (!basisServing) {
    return normalizedServings;
  }

  const additions = [];
  const basisUnit = String(basisServing.metricUnit || "").toLowerCase() || (/ml/i.test(basisServing.label || "") ? "ml" : "g");

  if (basisUnit === "g" || basisUnit === "gram" || basisUnit === "grams") {
    if (!servingExists(normalizedServings, "1 g")) {
      additions.push(scaleServing(basisServing, 1, "g", "1g", "1 g"));
    }
    if (!servingExists(normalizedServings, "1 oz")) {
      additions.push(scaleServing(basisServing, 28.3495, "g", "1oz", "1 oz"));
    }
  }

  if (basisUnit === "ml") {
    if (!servingExists(normalizedServings, "1 ml")) {
      additions.push(scaleServing(basisServing, 1, "ml", "1ml", "1 ml"));
    }
    if (!servingExists(normalizedServings, "1 fl oz")) {
      additions.push(scaleServing(basisServing, 29.5735, "ml", "1floz", "1 fl oz"));
    }
  }

  return [...normalizedServings, ...additions];
};

const getServingNutrition = (food, serving) => {
  if (serving && typeof serving.calories === "number") {
    const servingMicros = normalizeMicros(serving.micros || food.micros || {});
    return {
      calories: serving.calories,
      protein: serving.protein,
      carbs: serving.carbs,
      fat: serving.fat,
      micros: servingMicros,
    };
  }

  const multiplier = serving?.multiplier ?? 1;
  const servingMicros = scaleMicros(food.micros || {}, multiplier);
  return {
    calories: food.macros.calories * multiplier,
    protein: food.macros.protein * multiplier,
    carbs: food.macros.carbs * multiplier,
    fat: food.macros.fat * multiplier,
    micros: servingMicros,
  };
};

const snapshotServingOptions = (food = {}) =>
  (food?.servings || [])
    .map((serving, index) => {
      const nutrition = getServingNutrition(food, serving);
      return {
        id: String(serving?.id || `serving-${index + 1}`),
        label: String(serving?.label || "serving"),
        calories: Number(nutrition?.calories || 0),
        protein: Number(nutrition?.protein || 0),
        carbs: Number(nutrition?.carbs || 0),
        fat: Number(nutrition?.fat || 0),
        micros: normalizeMicros(nutrition?.micros || {}),
      };
    })
    .filter((serving) => serving.id);

const buildFallbackLoggedServing = (entry = {}) => {
  const quantity = Math.max(Number(entry.amount) || 1, 1);
  return {
    id: String(entry?.servingId || "serving"),
    label: String(entry?.unitLabel || "serving"),
    calories: Number((Number(entry?.calories) / quantity).toFixed(1)),
    protein: Number((Number(entry?.protein) / quantity).toFixed(1)),
    carbs: Number((Number(entry?.carbs) / quantity).toFixed(1)),
    fat: Number((Number(entry?.fat) / quantity).toFixed(1)),
    micros: scaleMicros(entry?.micros, 1 / quantity),
  };
};

const normalizeLoggedServingOption = (serving = {}, fallbackId = "serving") => ({
  id: String(serving?.id || fallbackId),
  label: String(serving?.label || "serving"),
  calories: Number(serving?.calories || 0),
  protein: Number(serving?.protein || 0),
  carbs: Number(serving?.carbs || 0),
  fat: Number(serving?.fat || 0),
  micros: normalizeMicros(serving?.micros || {}),
});

const createEntry = (food, servingId, amount) => {
  const serving = food.servings.find((item) => item.id === servingId) || food.servings[0];
  const quantity = Math.max(Number.parseFloat(amount) || 1, 0.25);
  const servingNutrition = getServingNutrition(food, serving);
  const entryMicros = scaleMicros(servingNutrition.micros, quantity);

  return {
    id: `${food.id}-${Date.now()}`,
    foodId: food.id,
    foodName: food.name,
    brand: food.brand,
    servingId: serving.id,
    unitLabel: serving.label,
    amount: formatValue(quantity),
    calories: Number((servingNutrition.calories * quantity).toFixed(1)),
    protein: Number((servingNutrition.protein * quantity).toFixed(1)),
    carbs: Number((servingNutrition.carbs * quantity).toFixed(1)),
    fat: Number((servingNutrition.fat * quantity).toFixed(1)),
    micros: entryMicros,
    servingOptions: snapshotServingOptions(food),
  };
};

const createFoodFromLoggedEntry = (entry) => {
  const quantity = Math.max(Number(entry.amount) || 1, 1);
  const servingOptions = Array.isArray(entry?.servingOptions) && entry.servingOptions.length
    ? entry.servingOptions.map((serving, index) => normalizeLoggedServingOption(serving, `serving-${index + 1}`))
    : [buildFallbackLoggedServing(entry)];
  const selectedServing =
    servingOptions.find((serving) => serving.id === entry?.servingId) ||
    servingOptions[0] ||
    buildFallbackLoggedServing(entry);

  return {
    id: entry.foodId,
    source: "logged-meal",
    name: entry.foodName,
    brand: entry.brand || "Logged meal",
    description: `${formatValue(entry.calories)} kcal | ${entry.amount} x ${selectedServing.label}`,
    keywords: [entry.foodName, entry.brand || "", entry.unitLabel || "", "logged", "meal"]
      .join(" ")
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean),
    macros: {
      calories: Number(selectedServing.calories || 0),
      protein: Number(selectedServing.protein || 0),
      carbs: Number(selectedServing.carbs || 0),
      fat: Number(selectedServing.fat || 0),
    },
    micros: selectedServing.micros || scaleMicros(entry.micros, 1 / quantity),
    servings: servingOptions,
  };
};

const cloneCompletedWorkout = (workout) => ({
  ...workout,
  exercises: workout.exercises.map((exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set) => ({ ...set })),
  })),
});

const sumMacros = (entries) =>
  entries.reduce(
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      protein: totals.protein + entry.protein,
      carbs: totals.carbs + entry.carbs,
      fat: totals.fat + entry.fat,
      micros: sumMicros([{ micros: totals.micros }, entry]),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, micros: createEmptyMicros() }
  );

const buildCustomMealFood = (name, ingredients) => {
  const totals = sumMacros(ingredients);
  return {
    id: `custom-meal-${Date.now()}`,
    source: "custom-meal",
    name: name.trim(),
    brand: "Custom Meal",
    description: `${ingredients.length} ingredient${ingredients.length === 1 ? "" : "s"} | ${formatValue(totals.calories)} kcal`,
    keywords: [
      name.trim(),
      "custom",
      "meal",
      ...ingredients.flatMap((ingredient) => [ingredient.foodName, ingredient.brand || "", ingredient.unitLabel || ""]),
    ]
      .join(" ")
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean),
    macros: {
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
    },
    micros: totals.micros,
    ingredients,
    servings: [
      {
        id: "custom-meal-serving",
        label: "1 meal",
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
        micros: totals.micros,
      },
    ],
  };
};

const buildCustomFood = ({ name, calories, protein, carbs, fat }) => ({
  id: `custom-food-${Date.now()}`,
  source: "custom-food",
  name: name.trim(),
  brand: "Custom Food",
  description: `${formatValue(calories)} kcal | P ${formatValue(protein)}g | C ${formatValue(carbs)}g | F ${formatValue(fat)}g`,
  keywords: [name.trim(), "custom", "food", "manual", "macros"]
    .join(" ")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean),
  macros: { calories, protein, carbs, fat },
  micros: createEmptyMicros(),
  servings: [
    {
      id: "custom-food-serving",
      label: "1 serving",
      calories,
      protein,
      carbs,
      fat,
      micros: createEmptyMicros(),
    },
  ],
});

const createWorkoutSet = (setNumber) => ({
  id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  setNumber,
  setType: "normal",
  previous: "--",
  weight: "",
  reps: "",
  completed: false,
});

const createTemplateSet = (setNumber, values = {}) => ({
  id: String(values?.id || `template-set-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
  setNumber,
  setType: values?.setType || "normal",
  previous: "--",
  weight: String(values?.weight ?? "0"),
  reps: String(values?.reps ?? ""),
  completed: false,
});

const normalizeTemplateExerciseSets = (exercise) => {
  const incomingSets = Array.isArray(exercise?.sets) && exercise.sets.length
    ? exercise.sets
    : Array.from({ length: Math.max(Number(exercise?.defaultSets) || 1, 1) }, (_, index) => ({ setNumber: index + 1 }));
  return incomingSets.map((set, index) => createTemplateSet(index + 1, set));
};

const workoutSetTypeMeta = {
  normal: { label: "Normal", color: theme.text, accent: theme.borderStrong },
  drop: { label: "Drop-Set", color: "#66a3ff", accent: "rgba(102,163,255,0.55)" },
  restPause: { label: "Rest-Pause", color: "#ff7676", accent: "rgba(255,118,118,0.55)" },
  warmup: { label: "Warmup", color: "#f2b34f", accent: "rgba(242,179,79,0.55)" },
};

const getWorkoutSetTypeMeta = (setType = "normal") => workoutSetTypeMeta[setType] || workoutSetTypeMeta.normal;

const formatMuscleGroupsInline = (muscles = [], fallback = "Muscles not assigned") =>
  muscles?.length ? muscles.join(" • ") : fallback;

const createWorkoutExercise = (exercise, defaultSets = 1) => {
  const baseSets = Array.isArray(exercise?.sets) && exercise.sets.length
    ? exercise.sets
    : Array.from({ length: Math.max(defaultSets, 1) }, (_, index) => ({ setNumber: index + 1 }));
  return ({
    id: `workout-exercise-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    exerciseId: exercise.exerciseId || exercise.id,
    name: exercise.name,
    previous: "--",
    sets: baseSets.map((set, index) => ({
      ...createWorkoutSet(index + 1),
      setType: set?.setType || "normal",
      weight: String(set?.weight ?? ""),
      reps: String(set?.reps ?? ""),
    })),
  });
};

const buildActiveWorkout = (name, exercises = [], templateId = null) => ({
  id: `active-workout-${Date.now()}`,
  templateId,
  name,
  dateKey: getDateKey(),
  startedAt: new Date().toISOString(),
  timerLastStartedAt: new Date().toISOString(),
  elapsedSecondsOffset: 0,
  isTimerPaused: false,
  exercises: exercises.map((exercise) => createWorkoutExercise(exercise, exercise.defaultSets)),
});

const getWorkoutExerciseDefinition = (exercise) =>
  exerciseCatalog.find((candidate) => candidate.id === exercise?.exerciseId || candidate.name === exercise?.name) || null;

const getSetVolume = (set) => {
  const weight = toNumber(set?.weight);
  const reps = toNumber(set?.reps);
  if (weight <= 0 || reps <= 0) {
    return 0;
  }

  return weight * reps;
};

const getWorkoutDurationSeconds = (startedAt, completedAt = new Date().toISOString()) => {
  const startMs = new Date(startedAt).getTime();
  const endMs = new Date(completedAt).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return 0;
  }

  return Math.max(Math.round((endMs - startMs) / 1000), 0);
};

const getActiveWorkoutElapsedSeconds = (workout, nowIso = new Date().toISOString()) => {
  if (!workout) {
    return 0;
  }

  const offset = Math.max(Number(workout.elapsedSecondsOffset) || 0, 0);
  if (workout.isTimerPaused || !workout.timerLastStartedAt) {
    return offset;
  }

  return offset + getWorkoutDurationSeconds(workout.timerLastStartedAt, nowIso);
};

const formatWorkoutDuration = (durationSeconds) => {
  const totalSeconds = Math.max(Number(durationSeconds) || 0, 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }

  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
};

const buildWorkoutSummary = (workout, priorCompletedWorkouts = [], completedAt = new Date().toISOString(), durationOverrideSeconds = null) => {
  const durationSeconds = durationOverrideSeconds == null
    ? getWorkoutDurationSeconds(workout?.startedAt, completedAt)
    : Math.max(Number(durationOverrideSeconds) || 0, 0);
  const muscleVolumeMap = new Map();
  let totalVolume = 0;
  const prSets = [];

  workout?.exercises?.forEach((exercise) => {
    const definition = getWorkoutExerciseDefinition(exercise);
    const muscleGroups = definition?.muscleGroups?.length ? definition.muscleGroups : ["Other"];

    exercise.sets.forEach((set, setIndex) => {
      const setVolume = getSetVolume(set);
      if (setVolume <= 0) {
        return;
      }

      totalVolume += setVolume;
      const distributedVolume = setVolume / muscleGroups.length;

      muscleGroups.forEach((muscle) => {
        muscleVolumeMap.set(muscle, (muscleVolumeMap.get(muscle) || 0) + distributedVolume);
      });

      const previousBestVolume = priorCompletedWorkouts.reduce((best, loggedWorkout) => {
        const matchingExercise = loggedWorkout.exercises.find((loggedExercise) =>
          loggedExercise.exerciseId === exercise.exerciseId || loggedExercise.name === exercise.name
        );
        if (!matchingExercise) {
          return best;
        }

        const exerciseBest = matchingExercise.sets.reduce((exerciseMax, loggedSet) => Math.max(exerciseMax, getSetVolume(loggedSet)), 0);
        return Math.max(best, exerciseBest);
      }, 0);

      if (previousBestVolume > 0 && setVolume > previousBestVolume) {
        prSets.push({
          id: `${exercise.id}-${set.id}`,
          exerciseName: exercise.name,
          setNumber: setIndex + 1,
          weight: set.weight,
          reps: set.reps,
          volume: setVolume,
          previousBestVolume,
        });
      }
    });
  });

  const muscleBreakdown = Array.from(muscleVolumeMap.entries())
    .map(([muscle, volume]) => ({
      muscle,
      volume,
      percentage: totalVolume > 0 ? (volume / totalVolume) * 100 : 0,
    }))
    .sort((left, right) => right.volume - left.volume);

  return {
    durationSeconds,
    durationLabel: formatWorkoutDuration(durationSeconds),
    totalVolume,
    muscleBreakdown,
    prSets: prSets.sort((left, right) => right.volume - left.volume).slice(0, 5),
    averageHeartRate: null,
  };
};

const formatExerciseInsightDate = (workout) => {
  const iso = workout?.completedAt || workout?.startedAt || (workout?.dateKey ? `${workout.dateKey}T00:00:00.000Z` : "");
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const buildExerciseInsight = (exercise, completedWorkouts = []) => {
  if (!exercise) {
    return null;
  }

  const definition = getWorkoutExerciseDefinition(exercise)
    || exerciseCatalog.find((candidate) => candidate.name === exercise?.name)
    || null;

  let bestVolumeSet = null;
  let heaviestSet = null;

  (completedWorkouts || []).forEach((workout) => {
    (workout?.exercises || []).forEach((loggedExercise) => {
      const isMatch = (
        (exercise?.exerciseId && loggedExercise?.exerciseId === exercise.exerciseId)
        || (exercise?.id && loggedExercise?.exerciseId === exercise.id)
        || loggedExercise?.name === exercise?.name
      );

      if (!isMatch) {
        return;
      }

      (loggedExercise?.sets || []).forEach((set) => {
        const weight = toNumber(set?.weight);
        const reps = toNumber(set?.reps);
        const volume = getSetVolume(set);
        const sourceDate = formatExerciseInsightDate(workout);

        if (volume > 0 && (!bestVolumeSet || volume > bestVolumeSet.volume || (volume === bestVolumeSet.volume && weight > bestVolumeSet.weight))) {
          bestVolumeSet = {
            weight,
            reps,
            volume,
            label: `${formatCompactNumber(weight, 0)} x ${formatCompactNumber(reps, 0)}`,
            detail: `${formatCompactNumber(volume, 0)} lb volume`,
            dateLabel: sourceDate,
            workoutName: workout?.name || "",
          };
        }

        if (weight > 0 && (!heaviestSet || weight > heaviestSet.weight || (weight === heaviestSet.weight && reps > heaviestSet.reps))) {
          heaviestSet = {
            weight,
            reps,
            volume,
            label: `${formatCompactNumber(weight, 0)} lbs`,
            detail: reps > 0 ? `${formatCompactNumber(reps, 0)} reps` : "Logged set",
            dateLabel: sourceDate,
            workoutName: workout?.name || "",
          };
        }
      });
    });
  });

  return {
    id: exercise?.exerciseId || exercise?.id || exercise?.name,
    name: exercise?.name || definition?.name || "Exercise",
    equipment: definition?.equipment || "",
    muscleGroups: definition?.muscleGroups?.length ? definition.muscleGroups : ["Not mapped yet"],
    bestVolumeSet,
    heaviestSet,
  };
};

const getPreviousSetPreview = (exercise, currentSet, allSets = [], completedWorkouts = []) => {
  if (!exercise || !currentSet) {
    return "--";
  }

  const currentType = currentSet.setType || "normal";
  const currentTypeOccurrence = allSets.reduce((count, set) => {
    if ((set.setType || "normal") !== currentType) {
      return count;
    }
    return count + (set.id === currentSet.id ? 0 : 1);
  }, 0);

  const sortedHistory = [...(completedWorkouts || [])].sort((left, right) =>
    String(right.completedAt || right.startedAt || "").localeCompare(String(left.completedAt || left.startedAt || ""))
  );

  for (const workout of sortedHistory) {
    const matchingExercise = (workout?.exercises || []).find((loggedExercise) =>
      (exercise?.exerciseId && loggedExercise?.exerciseId === exercise.exerciseId)
      || (exercise?.id && loggedExercise?.exerciseId === exercise.id)
      || loggedExercise?.name === exercise?.name
    );

    if (!matchingExercise) {
      continue;
    }

    const matchingTypeSets = (matchingExercise.sets || []).filter(
      (set) => (set.setType || "normal") === currentType
    );

    if (!matchingTypeSets.length) {
      continue;
    }

    const matchedSet = matchingTypeSets[currentTypeOccurrence] || matchingTypeSets[matchingTypeSets.length - 1];
    const weight = toNumber(matchedSet?.weight);
    const reps = toNumber(matchedSet?.reps);
    if (weight <= 0 && reps <= 0) {
      return "--";
    }
    return `${formatCompactNumber(weight, 0)} x ${formatCompactNumber(reps, 0)}`;
  }

  return "--";
};

const searchExercises = (query) => {
  const term = String(query || "").trim().toLowerCase();
  if (!term) {
    return exerciseCatalog.slice(0, 18);
  }

  return getRankedFoodMatches(
    exerciseCatalog.map((exercise) => ({
      ...exercise,
      brand: exercise.equipment,
      description: exercise.muscleGroups.join(" "),
      keywords: exercise.muscleGroups,
    })),
    term,
    24
  );
};

const resolveExerciseByName = (preferredName) =>
  exerciseCatalog.find((exercise) => exercise.name === preferredName)
  || searchExercises(preferredName)[0]
  || null;

const createWorkoutTemplate = ({ id, name, description, exercises, createdAt, isPlaceholder = false }) => ({
  id: id || `workout-template-${Date.now()}`,
  name,
  description,
  createdAt: createdAt || new Date().toISOString(),
  isPlaceholder,
  exercises: exercises
    .map((exerciseEntry) => {
      const exerciseName = Array.isArray(exerciseEntry) ? exerciseEntry[0] : exerciseEntry?.name;
      const defaultSets = Array.isArray(exerciseEntry) ? exerciseEntry[1] : exerciseEntry?.defaultSets;
      const exercise = resolveExerciseByName(exerciseName);
      if (!exercise) {
        return null;
      }

      return {
        id: `template-exercise-${exercise.id}-${defaultSets}`,
        exerciseId: exercise.id,
        name: exercise.name,
        defaultSets: Math.max(Number(defaultSets) || 1, 1),
        sets: normalizeTemplateExerciseSets(exerciseEntry),
      };
    })
    .filter(Boolean),
});

const placeholderWorkoutTemplates = bodybuildingPresetTemplateSpecs.map((template) =>
  createWorkoutTemplate({
    ...template,
    createdAt: "2026-04-20T07:00:00.000Z",
    isPlaceholder: true,
  })
);

const normalizeWorkoutTemplate = (template) => ({
  id: String(template?.id || `workout-template-${Date.now()}`),
  name: String(template?.name || "Workout"),
  description: String(template?.description || ""),
  createdAt: String(template?.createdAt || new Date().toISOString()),
  isPlaceholder: Boolean(template?.isPlaceholder),
  exercises: Array.isArray(template?.exercises)
    ? template.exercises.map((exercise, index) => {
        const resolved = exerciseCatalog.find((candidate) =>
          candidate.id === exercise?.exerciseId || candidate.name === exercise?.name
        );
        if (!resolved) {
          return null;
        }

        return {
          id: String(exercise?.id || `template-exercise-${resolved.id}-${index}`),
          exerciseId: resolved.id,
          name: resolved.name,
          defaultSets: Math.max(Number(exercise?.defaultSets) || 1, 1),
          sets: normalizeTemplateExerciseSets(exercise),
        };
      }).filter(Boolean)
    : [],
});

const splitSupportTemplateSpecs = [
  {
    id: "upper-body-placeholder",
    name: "Upper Day",
    description: "5 exercises - Chest, back, shoulders, and arms",
    exercises: [
      ["Barbell Incline Bench Press", 3],
      ["Wide-Grip Lat Pulldown", 3],
      ["Machine Shoulder Press", 3],
      ["Seated Cable Row", 3],
      ["EZ-Bar Curl", 3],
    ],
  },
  {
    id: "full-body-placeholder",
    name: "Full Body",
    description: "5 exercises - Full-body strength and hypertrophy",
    exercises: [
      ["Back Squat", 3],
      ["Barbell Incline Bench Press", 3],
      ["Seated Cable Row", 3],
      ["Romanian Deadlift", 3],
      ["Machine Shoulder Press", 3],
    ],
  },
];

const splitSupportTemplates = splitSupportTemplateSpecs.map((template) =>
  createWorkoutTemplate({
    ...template,
    createdAt: "2026-04-21T07:00:00.000Z",
    isPlaceholder: true,
  })
);

const legacyPlaceholderTemplateIds = new Set([
  "back-and-biceps",
  "chest-and-triceps",
  "leg-day",
  "shoulders-and-arms",
  "push-day",
  "pull-day",
  "upper-body-placeholder",
  "full-body-placeholder",
]);

const ensureProgramTemplates = (templates = []) => {
  const normalized = [
    ...placeholderWorkoutTemplates.map(normalizeWorkoutTemplate),
    ...(templates || [])
      .filter((template) => !(template?.isPlaceholder && legacyPlaceholderTemplateIds.has(String(template?.id || ""))))
      .map(normalizeWorkoutTemplate),
  ];
  const seen = new Set();
  return normalized.filter((template) => {
    const key = template.id || template.name.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const getWorkoutTemplateForSplitLabel = (label, templates = []) => {
  const normalizedLabel = String(label || "").toLowerCase();
  const lowerTemplates = templates.map((template) => ({
    ...template,
    lowerName: String(template.name || "").toLowerCase(),
  }));

  const preferredMatchers = {
    push: ["push day", "chest & triceps", "chest and triceps"],
    pull: ["pull day", "back & biceps", "back and biceps"],
    legs: ["leg day"],
    upper: ["upper day", "upper body", "shoulders & arms", "push day"],
    lower: ["leg day", "lower body"],
    "full body": ["full body", "upper day", "push day"],
    shoulders: ["shoulders & arms"],
    rest: [],
  };

  const matchers = preferredMatchers[normalizedLabel] || [normalizedLabel];
  for (const matcher of matchers) {
    const direct = lowerTemplates.find((template) => template.lowerName.includes(matcher));
    if (direct) {
      return direct;
    }
  }

  return lowerTemplates.find((template) => template.lowerName.includes(normalizedLabel)) || null;
};

const getCanonicalMuscleGroups = (selectedMuscles = []) => (
  selectedMuscles.flatMap((muscle) => customSplitMuscleAliases[muscle] || [muscle])
);

const getExerciseMatchScore = (exercise, selectedMuscles = []) => {
  const canonicalGroups = getCanonicalMuscleGroups(selectedMuscles);
  const exerciseGroups = exercise?.muscleGroups || [];
  if (!canonicalGroups.length || !exerciseGroups.length) {
    return 0;
  }

  let score = 0;
  canonicalGroups.forEach((group) => {
    if (exerciseGroups.some((exerciseGroup) => exerciseGroup.toLowerCase() === group.toLowerCase())) {
      score += 3;
    } else if (exerciseGroups.some((exerciseGroup) => exerciseGroup.toLowerCase().includes(group.toLowerCase()) || group.toLowerCase().includes(exerciseGroup.toLowerCase()))) {
      score += 2;
    }
  });

  if (selectedMuscles.length && exerciseGroups.length) {
    score += Math.min(exerciseGroups.length, selectedMuscles.length);
  }

  return score;
};

const getSuggestedExercisesForMuscles = (selectedMuscles = [], limit = 10) => {
  if (!selectedMuscles.length) {
    return exerciseCatalog.slice(0, limit);
  }

  return [...exerciseCatalog]
    .map((exercise) => ({ exercise, score: getExerciseMatchScore(exercise, selectedMuscles) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.exercise.name.localeCompare(right.exercise.name))
    .slice(0, limit)
    .map((entry) => entry.exercise);
};

const getTemplateMuscleGroups = (template) => {
  const muscleSet = new Set();
  (template?.exercises || []).forEach((exercise) => {
    const resolved = exerciseCatalog.find((entry) => entry.id === exercise.exerciseId || entry.name === exercise.name);
    (resolved?.muscleGroups || []).forEach((group) => muscleSet.add(group));
  });
  return Array.from(muscleSet);
};

const getSuggestedTemplatesForMuscles = (selectedMuscles = [], templates = [], limit = 6) => {
  if (!selectedMuscles.length) {
    return templates.slice(0, limit);
  }

  return [...templates]
    .map((template) => {
      const muscleGroups = getTemplateMuscleGroups(template);
      const score = selectedMuscles.reduce((total, muscle) => {
        const aliases = customSplitMuscleAliases[muscle] || [muscle];
        if (aliases.some((alias) => muscleGroups.some((group) => group.toLowerCase() === alias.toLowerCase()))) {
          return total + 4;
        }
        if (aliases.some((alias) => muscleGroups.some((group) => group.toLowerCase().includes(alias.toLowerCase()) || alias.toLowerCase().includes(group.toLowerCase())))) {
          return total + 2;
        }
        return total;
      }, 0);
      return { template, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.template.name.localeCompare(right.template.name))
    .slice(0, limit)
    .map((entry) => entry.template);
};

const formatAutoWorkoutDayName = (selectedMuscles = [], isRestDay = false) => {
  if (isRestDay || !selectedMuscles.length) {
    return "Rest";
  }

  const abbreviate = (muscle, compact = false) => {
    if (!compact) {
      return muscle;
    }
    return customSplitMuscleAbbreviations[muscle] || muscle;
  };

  if (selectedMuscles.length === 1) {
    return selectedMuscles[0];
  }

  if (selectedMuscles.length === 2) {
    return `${abbreviate(selectedMuscles[0], true)} & ${abbreviate(selectedMuscles[1], true)}`;
  }

  if (selectedMuscles.length === 3) {
    return `${abbreviate(selectedMuscles[0], true)}, ${abbreviate(selectedMuscles[1], true)} & ${abbreviate(selectedMuscles[2], true)}`;
  }

  return `${abbreviate(selectedMuscles[0], true)}, ${abbreviate(selectedMuscles[1], true)} +${selectedMuscles.length - 2}`;
};

const getWeekCycleIndex = (index = 0) => {
  const normalized = Number.isFinite(Number(index)) ? Number(index) : 0;
  return ((normalized % 7) + 7) % 7;
};

const getSplitLengthWeeks = (scheduledDays = []) => (
  Array.isArray(scheduledDays) && scheduledDays.length > 7 ? 2 : 1
);

const getCustomSplitFullDayLabel = (index = 0, totalDays = 7) => {
  const cycleIndex = getWeekCycleIndex(index);
  const baseName = weekDayNames[cycleIndex];
  if (totalDays <= 7) {
    return baseName;
  }
  const weekNumber = Math.floor(index / 7) + 1;
  return `${baseName} - Week ${weekNumber}`;
};

const createCustomSplitDayDraft = (index, totalDays = 7) => ({
  id: `custom-day-${Date.now()}-${index}`,
  orderIndex: index,
  dayOfWeek: getWeekCycleIndex(index),
  dayLabel: weekDayLabels[getWeekCycleIndex(index)],
  fullDayLabel: getCustomSplitFullDayLabel(index, totalDays),
  label: "Rest",
  isRestDay: true,
  workoutTemplateId: null,
});

const buildCustomSplitScheduledDays = (lengthWeeks = 1, existingDays = []) => {
  const normalizedWeeks = Math.min(Math.max(Number(lengthWeeks) || 1, 1), 2);
  const totalDays = normalizedWeeks * 7;
  return Array.from({ length: totalDays }, (_, index) => {
    const existingDay = existingDays[index];
    if (existingDay) {
      return {
        ...existingDay,
        orderIndex: index,
        dayOfWeek: getWeekCycleIndex(index),
        dayLabel: weekDayLabels[getWeekCycleIndex(index)],
        fullDayLabel: getCustomSplitFullDayLabel(index, totalDays),
        label: existingDay.isRestDay ? "Rest" : String(existingDay.label || "Workout"),
        workoutTemplateId: existingDay.isRestDay ? null : existingDay.workoutTemplateId || null,
        isRestDay: Boolean(existingDay.isRestDay || !existingDay.workoutTemplateId),
      };
    }
    return createCustomSplitDayDraft(index, totalDays);
  });
};

const createEmptyCustomSplitDraft = (lengthWeeks = 1) => ({
  name: "",
  lengthWeeks: Math.min(Math.max(Number(lengthWeeks) || 1, 1), 2),
  scheduledDays: buildCustomSplitScheduledDays(lengthWeeks),
});

const createEmptyTemplateDraft = () => ({
  id: "",
  name: "",
  description: "",
  createdAt: new Date().toISOString(),
  isPlaceholder: false,
  exercises: [],
});

const createDiaryEntryEditorDraft = (meal, entry) => {
  const food = createFoodFromLoggedEntry(entry);
  return {
    meal,
    originalEntryId: entry.id,
    food,
    servingId: entry.servingId || food.servings?.[0]?.id || "",
    amount: String(entry.amount || "1"),
    mealAssignment: meal,
    name: entry.foodName || "",
  };
};

const mapCloudProfileToLocal = (profile = {}) => ({
  firstName: String(profile?.first_name || ""),
  height: String(profile?.height || ""),
  weightLbs: String(profile?.weight_lbs || ""),
  sex: String(profile?.sex || ""),
  profilePhotoUri: String(profile?.profile_photo_uri || ""),
});

const buildCloudProfilePayload = (userId, profile = {}) => ({
  user_id: userId,
  first_name: String(profile?.firstName || "").trim(),
  height: String(profile?.height || "").trim(),
  weight_lbs: String(profile?.weightLbs || "").trim(),
  sex: String(profile?.sex || "").trim(),
  profile_photo_uri: String(profile?.profilePhotoUri || "").trim(),
});

const inferDiaryEntrySource = (entry = {}) => {
  if (String(entry?.foodId || "").startsWith("custom-meal-")) {
    return "custom-meal";
  }
  if (String(entry?.foodId || "").startsWith("custom-food-")) {
    return "custom-food";
  }
  if (String(entry?.foodId || "").startsWith("fatsecret-")) {
    return "fatsecret";
  }
  return "sample";
};

const buildCloudDiaryRows = (userId, foodDiaryByDate = {}) =>
  Object.entries(serializeFoodDiaryByDate(foodDiaryByDate)).flatMap(([dateKey, diary]) =>
    mealOrder.flatMap((meal) =>
      (diary?.[meal] || []).map((entry) => ({
        user_id: userId,
        date_key: dateKey,
        meal_type: meal,
        food_name: String(entry?.foodName || ""),
        brand: String(entry?.brand || ""),
        source: inferDiaryEntrySource(entry),
        source_food_id: String(entry?.foodId || ""),
        serving_id: String(entry?.servingId || ""),
        unit_label: String(entry?.unitLabel || ""),
        amount: Number(entry?.amount) || 1,
        calories: Number(entry?.calories) || 0,
        protein: Number(entry?.protein) || 0,
        carbs: Number(entry?.carbs) || 0,
        fat: Number(entry?.fat) || 0,
        micros_json: entry?.micros || {},
        updated_at: new Date().toISOString(),
      }))
    )
  );

const buildCloudCheckInPayload = (userId, checkIns = []) => {
  const checkInRows = [];
  const photoRows = [];

  (checkIns || []).forEach((entry) => {
    const normalizedEntry = normalizeCheckInEntry(entry);
    const checkInId = stableUuidFromString(`checkin:${userId}:${normalizedEntry.dateKey}`);
    checkInRows.push({
      id: checkInId,
      user_id: userId,
      date_key: normalizedEntry.dateKey,
      weight_lbs: toNumber(normalizedEntry.weightLbs) || null,
      notes: String(normalizedEntry.notes || ""),
      created_at: normalizedEntry.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    (normalizedEntry.photos || []).forEach((photo, index) => {
      photoRows.push({
        id: stableUuidFromString(`checkin-photo:${userId}:${normalizedEntry.dateKey}:${photo.id || photo.uri || index}`),
        check_in_id: checkInId,
        user_id: userId,
        photo_path: String(photo.uri || ""),
        photo_type: String(photo.type || "other"),
        created_at: String(photo.createdAt || new Date().toISOString()),
      });
    });
  });

  return {
    checkIns: checkInRows,
    photos: photoRows,
  };
};

const hashStringParts = (input = "") => {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;

  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    h1 = h2 ^ Math.imul(h1 ^ code, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ code, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ code, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ code, 2716044179);
  }

  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);

  return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
};

const stableUuidFromString = (input = "") => {
  const hex = hashStringParts(String(input))
    .map((part) => part.toString(16).padStart(8, "0"))
    .join("");
  const chars = hex.slice(0, 32).split("");
  chars[12] = "4";
  chars[16] = ((Number.parseInt(chars[16], 16) & 0x3) | 0x8).toString(16);
  const normalized = chars.join("");
  return `${normalized.slice(0, 8)}-${normalized.slice(8, 12)}-${normalized.slice(12, 16)}-${normalized.slice(16, 20)}-${normalized.slice(20, 32)}`;
};

const buildCloudWorkoutTemplatePayload = (userId, templates = []) => {
  const templateRows = [];
  const exerciseRows = [];
  const setRows = [];

  (templates || []).filter((template) => !template?.isPlaceholder).forEach((template) => {
    const templateUuid = stableUuidFromString(`template:${userId}:${template.id}`);
    templateRows.push({
      id: templateUuid,
      user_id: userId,
      name: String(template?.name || "Workout"),
      description: String(template?.description || ""),
      is_placeholder: Boolean(template?.isPlaceholder),
      created_at: template?.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    (template?.exercises || []).forEach((exercise, exerciseIndex) => {
      const exerciseUuid = stableUuidFromString(`template-exercise:${userId}:${template.id}:${exercise.id || exercise.exerciseId || exerciseIndex}`);
      exerciseRows.push({
        id: exerciseUuid,
        template_id: templateUuid,
        exercise_id: String(exercise?.exerciseId || ""),
        name: String(exercise?.name || "Exercise"),
        order_index: exerciseIndex,
        default_sets: Math.max(Number(exercise?.defaultSets) || (exercise?.sets?.length || 1), 1),
        created_at: new Date().toISOString(),
      });

      (exercise?.sets || []).forEach((set, setIndex) => {
        setRows.push({
          id: stableUuidFromString(`template-set:${userId}:${template.id}:${exercise.id || exercise.exerciseId || exerciseIndex}:${set.id || setIndex}`),
          template_exercise_id: exerciseUuid,
          set_number: setIndex + 1,
          set_type: String(set?.setType || "normal"),
          weight: String(set?.weight ?? "0"),
          reps: String(set?.reps ?? ""),
          created_at: new Date().toISOString(),
        });
      });
    });
  });

  return {
    templates: templateRows,
    exercises: exerciseRows,
    sets: setRows,
  };
};

const buildCloudTrainingProgramPayload = (userId, splits = [], activeSplitKey = "", templates = []) => {
  const programRows = [];
  const dayRows = [];
  const validTemplateIds = new Set((templates || []).filter((template) => !template?.isPlaceholder).map((template) => String(template?.id || "")).filter(Boolean));

  (splits || []).forEach((split) => {
    const programUuid = stableUuidFromString(`program:${userId}:${split.id}`);
    programRows.push({
      id: programUuid,
      user_id: userId,
      name: String(split?.name || "Training Split"),
      split_type: String(split?.splitType || "CUSTOM"),
      split_length_weeks: Math.max(Number(split?.splitLengthWeeks) || 1, 1),
      rest_days: Math.max(Number(split?.restDays) || 0, 0),
      is_active: split?.id === activeSplitKey,
      is_customized_order: Boolean(split?.isCustomizedOrder),
      is_manually_edited: Boolean(split?.isManuallyEdited),
      created_at: split?.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    (split?.scheduledDays || []).forEach((day, index) => {
      const localTemplateId = String(day?.workoutTemplateId || "");
      const hasValidTemplate = localTemplateId && validTemplateIds.has(localTemplateId);
      const workoutTemplateUuid = hasValidTemplate
        ? stableUuidFromString(`template:${userId}:${localTemplateId}`)
        : null;
      const dayShouldBeRest = Boolean(day?.isRestDay || !hasValidTemplate);
      dayRows.push({
        id: stableUuidFromString(`program-day:${userId}:${split.id}:${day.id || index}`),
        program_id: programUuid,
        order_index: index,
        day_of_week: Number(day?.dayOfWeek ?? (index % 7)),
        day_label: String(day?.dayLabel || weekDayLabels[index % 7]),
        full_day_label: String(day?.fullDayLabel || weekDayNames[index % 7]),
        label: String(dayShouldBeRest ? "Rest" : (day?.label || "Workout")),
        workout_template_id: workoutTemplateUuid,
        is_rest_day: dayShouldBeRest,
        created_at: new Date().toISOString(),
      });
    });
  });

  return {
    programs: programRows,
    days: dayRows,
  };
};

const buildCloudCompletedWorkoutPayload = (userId, workouts = [], templates = []) => {
  const completedRows = [];
  const exerciseRows = [];
  const setRows = [];
  const syncedTemplateIds = new Set((templates || []).filter((template) => !template?.isPlaceholder).map((template) => String(template.id)));

  (workouts || []).filter((workout) => !isPlaceholderCompletedWorkout(workout)).forEach((workout) => {
    const workoutUuid = stableUuidFromString(`completed-workout:${userId}:${workout.id}`);
    const templateUuid = workout?.templateId && syncedTemplateIds.has(String(workout.templateId))
      ? stableUuidFromString(`template:${userId}:${workout.templateId}`)
      : null;
    completedRows.push({
      id: workoutUuid,
      user_id: userId,
      template_id: templateUuid,
      name: String(workout?.name || "Workout"),
      date_key: String(workout?.dateKey || getDateKey(new Date(workout?.completedAt || new Date()))),
      started_at: workout?.startedAt || null,
      completed_at: workout?.completedAt || null,
      duration_seconds: Number(workout?.summary?.durationSeconds) || 0,
      summary_json: workout?.summary || {},
      created_at: workout?.completedAt || workout?.startedAt || new Date().toISOString(),
    });

    (workout?.exercises || []).forEach((exercise, exerciseIndex) => {
      const exerciseUuid = stableUuidFromString(`completed-exercise:${userId}:${workout.id}:${exercise.id || exercise.exerciseId || exerciseIndex}`);
      exerciseRows.push({
        id: exerciseUuid,
        completed_workout_id: workoutUuid,
        exercise_id: String(exercise?.exerciseId || ""),
        name: String(exercise?.name || "Exercise"),
        order_index: exerciseIndex,
        created_at: workout?.completedAt || workout?.startedAt || new Date().toISOString(),
      });

      (exercise?.sets || []).forEach((set, setIndex) => {
        setRows.push({
          id: stableUuidFromString(`completed-set:${userId}:${workout.id}:${exercise.id || exercise.exerciseId || exerciseIndex}:${set.id || setIndex}`),
          completed_workout_exercise_id: exerciseUuid,
          set_number: setIndex + 1,
          set_type: String(set?.setType || "normal"),
          previous: String(set?.previous || "--"),
          weight: String(set?.weight ?? ""),
          reps: String(set?.reps ?? ""),
          completed: Boolean(set?.completed),
          created_at: workout?.completedAt || workout?.startedAt || new Date().toISOString(),
        });
      });
    });
  });

  return {
    workouts: completedRows,
    exercises: exerciseRows,
    sets: setRows,
  };
};

const buildLocalDiaryByDateFromCloudRows = (rows = []) => {
  const nextDiary = {};
  (rows || []).forEach((row) => {
    const dateKey = String(row?.date_key || "");
    const meal = String(row?.meal_type || "Other");
    if (!dateKey) {
      return;
    }
    if (!nextDiary[dateKey]) {
      nextDiary[dateKey] = emptyDiary();
    }
    if (!nextDiary[dateKey][meal]) {
      nextDiary[dateKey][meal] = [];
    }
    nextDiary[dateKey][meal].push({
      id: String(row?.id || `${dateKey}-${meal}-${Date.now()}`),
      foodId: String(row?.source_food_id || ""),
      foodName: String(row?.food_name || "Food"),
      brand: String(row?.brand || ""),
      servingId: String(row?.serving_id || ""),
      unitLabel: String(row?.unit_label || "serving"),
      amount: formatValue(Number(row?.amount) || 1),
      calories: Number(row?.calories) || 0,
      protein: Number(row?.protein) || 0,
      carbs: Number(row?.carbs) || 0,
      fat: Number(row?.fat) || 0,
      micros: row?.micros_json || createEmptyMicros(),
    });
  });
  return serializeFoodDiaryByDate(nextDiary);
};

const getCanonicalPlaceholderTemplateId = (name = "") => {
  const match = ensureProgramTemplates([]).find(
    (template) => template.isPlaceholder && template.name.toLowerCase() === String(name || "").toLowerCase()
  );
  return match?.id || null;
};

const buildLocalWorkoutTemplatesFromCloud = (payload = {}) => {
  const exerciseRowsByTemplateId = new Map();
  const setRowsByExerciseId = new Map();

  (payload?.exercises || []).forEach((row) => {
    const list = exerciseRowsByTemplateId.get(row.template_id) || [];
    list.push(row);
    exerciseRowsByTemplateId.set(row.template_id, list);
  });

  (payload?.sets || []).forEach((row) => {
    const list = setRowsByExerciseId.get(row.template_exercise_id) || [];
    list.push(row);
    setRowsByExerciseId.set(row.template_exercise_id, list);
  });

  return (payload?.templates || []).map((templateRow) => {
    const canonicalPlaceholderId = templateRow.is_placeholder ? getCanonicalPlaceholderTemplateId(templateRow.name) : null;
    const localTemplateId = canonicalPlaceholderId || String(templateRow.id);
    const exerciseRows = [...(exerciseRowsByTemplateId.get(templateRow.id) || [])].sort(
      (left, right) => Number(left.order_index) - Number(right.order_index)
    );

    return normalizeWorkoutTemplate({
      id: localTemplateId,
      name: templateRow.name,
      description: templateRow.description || "",
      createdAt: templateRow.created_at || new Date().toISOString(),
      isPlaceholder: Boolean(templateRow.is_placeholder),
      exercises: exerciseRows.map((exerciseRow) => ({
        id: String(exerciseRow.id),
        exerciseId: String(exerciseRow.exercise_id || ""),
        name: String(exerciseRow.name || "Exercise"),
        defaultSets: Math.max(Number(exerciseRow.default_sets) || 1, 1),
        sets: [...(setRowsByExerciseId.get(exerciseRow.id) || [])]
          .sort((left, right) => Number(left.set_number) - Number(right.set_number))
          .map((setRow, index) => ({
            id: String(setRow.id),
            setNumber: index + 1,
            setType: String(setRow.set_type || "normal"),
            weight: String(setRow.weight ?? "0"),
            reps: String(setRow.reps ?? ""),
          })),
      })),
    });
  });
};

const getCanonicalPremadeSplitId = (programRow) => {
  const splitType = String(programRow?.split_type || "").toUpperCase();
  const normalizedName = String(programRow?.name || "").toLowerCase();
  if (splitType === "PPL" && normalizedName.includes("push")) {
    return "split-premade-ppl";
  }
  if (splitType === "UL" && normalizedName.includes("upper")) {
    return "split-premade-ul";
  }
  if (splitType === "FB" && normalizedName.includes("full")) {
    return "split-premade-fb";
  }
  return null;
};

const buildLocalTrainingSplitsFromCloud = (payload = {}, templates = []) => {
  const daysByProgramId = new Map();
  (payload?.days || []).forEach((row) => {
    const list = daysByProgramId.get(row.program_id) || [];
    list.push(row);
    daysByProgramId.set(row.program_id, list);
  });

  const templateIdMap = new Map(templates.map((template) => [String(template.id), template.id]));

  return (payload?.programs || []).map((programRow) => {
    const isPremade = ["PPL", "UL", "FB"].includes(String(programRow?.split_type || "").toUpperCase());
    const localSplitId = isPremade ? getCanonicalPremadeSplitId(programRow) || String(programRow.id) : String(programRow.id);
    const programDays = [...(daysByProgramId.get(programRow.id) || [])].sort(
      (left, right) => Number(left.order_index) - Number(right.order_index)
    );

    return normalizeTrainingSplit({
      id: localSplitId,
      name: String(programRow?.name || "Training Split"),
      splitType: String(programRow?.split_type || "CUSTOM"),
      splitLengthWeeks: Math.max(Number(programRow?.split_length_weeks) || 1, 1),
      baseSplitType: isPremade ? String(programRow?.split_type || "") : null,
      isCustomizedOrder: Boolean(programRow?.is_customized_order),
      isManuallyEdited: Boolean(programRow?.is_manually_edited),
      type: isPremade ? "premade" : "custom",
      restDays: Math.max(Number(programRow?.rest_days) || 0, 0),
      createdAt: programRow?.created_at || new Date().toISOString(),
      updatedAt: programRow?.updated_at || new Date().toISOString(),
      scheduledDays: programDays.map((dayRow, index) => {
        const localTemplateId = dayRow?.workout_template_id
          ? (templateIdMap.get(String(dayRow.workout_template_id)) || String(dayRow.workout_template_id))
          : null;
        const isRestDay = Boolean(dayRow?.is_rest_day || !localTemplateId);
        return {
          id: String(dayRow.id),
          orderIndex: index,
          dayOfWeek: Number(dayRow?.day_of_week ?? (index % 7)),
          dayLabel: String(dayRow?.day_label || weekDayLabels[index % 7]),
          fullDayLabel: String(dayRow?.full_day_label || getCustomSplitFullDayLabel(index, programDays.length)),
          label: String(isRestDay ? "Rest" : (dayRow?.label || "Workout")),
          workoutTemplateId: isRestDay ? null : localTemplateId,
          isRestDay,
        };
      }),
    }, templates);
  });
};

const buildLocalCompletedWorkoutsFromCloud = (payload = {}, templates = []) => {
  const exercisesByWorkoutId = new Map();
  const setsByExerciseId = new Map();
  const templateIdMap = new Map(templates.map((template) => [String(template.id), template.id]));

  (payload?.exercises || []).forEach((row) => {
    const list = exercisesByWorkoutId.get(row.completed_workout_id) || [];
    list.push(row);
    exercisesByWorkoutId.set(row.completed_workout_id, list);
  });

  (payload?.sets || []).forEach((row) => {
    const list = setsByExerciseId.get(row.completed_workout_exercise_id) || [];
    list.push(row);
    setsByExerciseId.set(row.completed_workout_exercise_id, list);
  });

  return (payload?.workouts || []).map((workoutRow) => {
    const workoutExercises = [...(exercisesByWorkoutId.get(workoutRow.id) || [])].sort(
      (left, right) => Number(left.order_index) - Number(right.order_index)
    );
    return normalizeCompletedWorkoutRecord({
      id: String(workoutRow.id),
      templateId: workoutRow?.template_id ? (templateIdMap.get(String(workoutRow.template_id)) || String(workoutRow.template_id)) : null,
      name: String(workoutRow?.name || "Workout"),
      startedAt: workoutRow?.started_at || workoutRow?.created_at || new Date().toISOString(),
      completedAt: workoutRow?.completed_at || workoutRow?.created_at || new Date().toISOString(),
      dateKey: String(workoutRow?.date_key || getDateKey()),
      exercises: workoutExercises.map((exerciseRow) => ({
        id: String(exerciseRow.id),
        exerciseId: String(exerciseRow.exercise_id || ""),
        name: String(exerciseRow.name || "Exercise"),
        sets: [...(setsByExerciseId.get(exerciseRow.id) || [])]
          .sort((left, right) => Number(left.set_number) - Number(right.set_number))
          .map((setRow, index) => ({
            id: String(setRow.id),
            setNumber: index + 1,
            setType: String(setRow.set_type || "normal"),
            previous: String(setRow.previous || "--"),
            weight: String(setRow.weight ?? ""),
            reps: String(setRow.reps ?? ""),
            completed: Boolean(setRow.completed),
          })),
      })),
      summary: workoutRow?.summary_json || null,
    });
  });
};

const hasMeaningfulLocalData = ({ foodDiaryByDate, checkIns, workoutTemplates, trainingSplits, completedWorkouts, userProfile }) => {
  const diaryEntryCount = Object.values(serializeFoodDiaryByDate(foodDiaryByDate || {})).reduce(
    (sum, diary) => sum + mealOrder.reduce((mealSum, meal) => mealSum + ((diary?.[meal] || []).length), 0),
    0
  );
  const customWorkoutCount = (workoutTemplates || []).filter((template) => !template.isPlaceholder).length;
  const customSplitCount = (trainingSplits || []).filter((split) => split.type === "custom").length;
  const realCompletedWorkoutCount = (completedWorkouts || []).filter((workout) => !isPlaceholderCompletedWorkout(workout)).length;
  return (
    diaryEntryCount > 0 ||
    (checkIns || []).length > 0 ||
    customWorkoutCount > 0 ||
    customSplitCount > 0 ||
    realCompletedWorkoutCount > 0 ||
    hasAnyLocalProfileData(userProfile)
  );
};

const hasAnyLocalProfileData = (profile = {}) =>
  Boolean(profile?.firstName || profile?.height || profile?.weightLbs || profile?.sex);

const distributeRestIndexes = (restDays) => {
  const indexes = [];
  const clamped = Math.min(Math.max(Number(restDays) || 1, 1), 5);
  for (let index = 0; index < clamped; index += 1) {
    const suggestedIndex = Math.round((((index + 1) * 7) / (clamped + 1)) - 1);
    indexes.push(Math.max(0, Math.min(6, suggestedIndex)));
  }
  return Array.from(new Set(indexes)).sort((left, right) => left - right);
};

const buildScheduleFromPremadeSplit = (splitType, restDays, templates = []) => {
  const normalizedType = String(splitType || "PPL").toUpperCase();
  const sequenceMap = {
    PPL: ["Push", "Pull", "Legs"],
    UL: ["Upper", "Lower"],
    FB: ["Full Body"],
  };
  const sequence = sequenceMap[normalizedType] || sequenceMap.PPL;
  const trainingDays = Math.max(7 - Math.min(Math.max(Number(restDays) || 1, 1), 5), 1);
  const restIndexes = distributeRestIndexes(7 - trainingDays);
  let workoutCursor = 0;

  return weekDayNames.map((dayName, index) => {
    const isRestDay = restIndexes.includes(index);
    const workoutLabel = isRestDay ? "Rest" : sequence[workoutCursor % sequence.length];
    if (!isRestDay) {
      workoutCursor += 1;
    }
    const template = isRestDay ? null : getWorkoutTemplateForSplitLabel(workoutLabel, templates);
    return {
      id: `scheduled-day-${normalizedType.toLowerCase()}-${index}`,
      dayOfWeek: index,
      dayLabel: weekDayLabels[index],
      fullDayLabel: dayName,
      label: workoutLabel,
      workoutTemplateId: template?.id || null,
      isRestDay,
    };
  });
};

const createTrainingSplit = ({
  id,
  name,
  type = "premade",
  splitType = "PPL",
  baseSplitType = null,
  isCustomizedOrder = false,
  isManuallyEdited = false,
  restDays = 1,
  splitLengthWeeks = 1,
  scheduledDays = [],
  createdAt,
  updatedAt,
  isPlaceholder = false,
}) => {
  const normalizedScheduleLength = Array.isArray(scheduledDays) && scheduledDays.length ? scheduledDays.length : 7;
  const normalizedLengthWeeks = Math.min(Math.max(Number(splitLengthWeeks) || getSplitLengthWeeks(scheduledDays), 1), 2);
  return ({
  id: String(id || `training-split-${Date.now()}`),
  name: String(name || "Training Split"),
  type,
  splitType,
  splitLengthWeeks: normalizedLengthWeeks,
  baseSplitType: baseSplitType ?? (splitType === "CUSTOM" ? null : splitType),
  isCustomizedOrder: Boolean(isCustomizedOrder),
  isManuallyEdited: Boolean(isManuallyEdited),
  restDays: Math.min(Math.max(Number(restDays) || 0, 0), Math.max(normalizedScheduleLength - 1, 0)),
  scheduledDays: scheduledDays.map((day, index) => ({
    id: String(day?.id || `scheduled-day-${index}`),
    orderIndex: Number.isFinite(Number(day?.orderIndex)) ? Number(day.orderIndex) : index,
    dayOfWeek: getWeekCycleIndex(index),
    dayLabel: weekDayLabels[getWeekCycleIndex(index)],
    fullDayLabel: getCustomSplitFullDayLabel(index, normalizedScheduleLength),
    label: String(day?.label || (day?.isRestDay ? "Rest" : `Day ${index + 1}`)),
    workoutTemplateId: day?.workoutTemplateId || null,
    isRestDay: Boolean(day?.isRestDay),
  })),
  createdAt: String(createdAt || new Date().toISOString()),
  updatedAt: String(updatedAt || new Date().toISOString()),
  isPlaceholder: Boolean(isPlaceholder),
});
};

const getDefaultPremadeSplits = (templates = []) => [
  createTrainingSplit({
    id: "split-premade-ppl",
    name: "Push / Pull / Legs",
    splitType: "PPL",
    type: "premade",
    restDays: 1,
    isPlaceholder: true,
    createdAt: "2026-04-21T07:30:00.000Z",
    scheduledDays: buildScheduleFromPremadeSplit("PPL", 1, templates),
  }),
  createTrainingSplit({
    id: "split-premade-ul",
    name: "Upper / Lower",
    splitType: "UL",
    type: "premade",
    restDays: 3,
    isPlaceholder: true,
    createdAt: "2026-04-21T07:35:00.000Z",
    scheduledDays: buildScheduleFromPremadeSplit("UL", 3, templates),
  }),
  createTrainingSplit({
    id: "split-premade-fb",
    name: "Full Body",
    splitType: "FB",
    type: "premade",
    restDays: 4,
    isPlaceholder: true,
    createdAt: "2026-04-21T07:40:00.000Z",
    scheduledDays: buildScheduleFromPremadeSplit("FB", 4, templates),
  }),
];

const getSplitDisplayName = (split = {}) => {
  const type = String(split?.splitType || "").toUpperCase();
  if (type === "PPL") {
    return "Push Pull Legs";
  }
  if (type === "UL") {
    return "Upper Lower";
  }
  if (type === "FB") {
    return "Full Body";
  }
  return split?.name || "Custom Split";
};

const normalizeTrainingSplit = (split, templates = []) => {
  const normalizedType = split?.splitType || (split?.name?.toLowerCase().includes("upper") ? "UL" : split?.name?.toLowerCase().includes("full") ? "FB" : "PPL");
  const providedScheduledDays = Array.isArray(split?.scheduledDays) ? split.scheduledDays : [];
  const normalizedLengthWeeks = Math.min(Math.max(Number(split?.splitLengthWeeks) || getSplitLengthWeeks(providedScheduledDays), 1), 2);
  const isValidCustomLength = providedScheduledDays.length === 7 || providedScheduledDays.length === 14;
  const shouldPreserveSchedule = String(normalizedType || "").toUpperCase() === "CUSTOM" || Boolean(split?.isCustomizedOrder || split?.isManuallyEdited);
  const schedule = isValidCustomLength && shouldPreserveSchedule
    ? [...split.scheduledDays]
      .sort((left, right) => {
        const leftOrder = Number.isFinite(Number(left?.orderIndex)) ? Number(left.orderIndex) : Number(left?.dayOfWeek);
        const rightOrder = Number.isFinite(Number(right?.orderIndex)) ? Number(right.orderIndex) : Number(right?.dayOfWeek);
        return leftOrder - rightOrder;
      })
      .map((day, index) => ({
        id: String(day?.id || `scheduled-day-${index}`),
        orderIndex: Number.isFinite(Number(day?.orderIndex)) ? Number(day.orderIndex) : index,
        dayOfWeek: getWeekCycleIndex(index),
        dayLabel: weekDayLabels[getWeekCycleIndex(index)],
        fullDayLabel: getCustomSplitFullDayLabel(index, providedScheduledDays.length),
        label: String(day?.label || (day?.isRestDay ? "Rest" : `Day ${index + 1}`)),
        workoutTemplateId: day?.workoutTemplateId || null,
        isRestDay: Boolean(day?.isRestDay),
      }))
    : buildScheduleFromPremadeSplit(normalizedType, Math.min(Math.max(Number(split?.restDays) || 0, 0), 6), templates);
  const restDays = Math.min(
    Math.max(Number(split?.restDays) || schedule.filter((day) => day.isRestDay).length || 0, 0),
    Math.max(schedule.length - 1, 0)
  );

  return createTrainingSplit({
    ...split,
    splitType: normalizedType,
    splitLengthWeeks: normalizedLengthWeeks,
    baseSplitType: split?.baseSplitType ?? (normalizedType === "CUSTOM" ? null : normalizedType),
    isCustomizedOrder: Boolean(split?.isCustomizedOrder),
    isManuallyEdited: Boolean(split?.isManuallyEdited),
    restDays,
    scheduledDays: schedule,
  });
};

const seedPremadeSplitsIfNeeded = (savedSplits = [], templates = []) => {
  const normalizedSaved = Array.isArray(savedSplits) ? savedSplits.map((split) => normalizeTrainingSplit(split, templates)) : [];
  const premades = getDefaultPremadeSplits(templates);
  const byId = new Map(normalizedSaved.map((split) => [split.id, split]));
  premades.forEach((split) => {
    const existing = byId.get(split.id);
    if (!existing || (!existing.isCustomizedOrder && !existing.isManuallyEdited)) {
      byId.set(split.id, split);
    }
  });
  return Array.from(byId.values());
};

const reorderScheduledDay = (scheduledDays = [], fromIndex, toIndex) => {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex > 6 || toIndex > 6) {
    return scheduledDays;
  }
  const next = [...scheduledDays];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next.map((day, index) => ({
    ...day,
    orderIndex: index,
    dayOfWeek: index,
    dayLabel: weekDayLabels[index],
    fullDayLabel: weekDayNames[index],
  }));
};

const getStartOfWeek = (date = new Date()) => {
  const next = new Date(date);
  const day = next.getDay();
  const diff = -day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
};

const getWeekDates = (selectedDate = new Date()) => {
  const start = getStartOfWeek(selectedDate);
  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(start);
    next.setDate(start.getDate() + index);
    return next;
  });
};

const getStartOfMonth = (date = new Date()) => {
  const next = new Date(date.getFullYear(), date.getMonth(), 1);
  next.setHours(0, 0, 0, 0);
  return next;
};

const shiftMonth = (date = new Date(), offset = 0) => {
  const next = new Date(date.getFullYear(), date.getMonth() + offset, 1);
  next.setHours(0, 0, 0, 0);
  return next;
};

const getMonthCalendarDates = (monthDate = new Date()) => {
  const startOfMonth = getStartOfMonth(monthDate);
  const gridStart = getStartOfWeek(startOfMonth);

  return Array.from({ length: 42 }, (_, index) => {
    const next = new Date(gridStart);
    next.setDate(gridStart.getDate() + index);
    return next;
  });
};

const getActiveSplit = (splits = [], activeSplitId = "") =>
  splits.find((split) => split.id === activeSplitId) || splits[0] || null;

const adjustCustomSplitRestDays = (scheduledDays = [], nextRestDays, templates = []) => {
  const nextDays = (scheduledDays || []).map((day, index) => ({ ...day, orderIndex: index }));
  const targetRestDays = Math.max(Math.min(Number(nextRestDays) || 0, Math.max(nextDays.length - 1, 0)), 0);
  const currentRestDays = nextDays.filter((day) => day.isRestDay).length;

  if (currentRestDays === targetRestDays) {
    return nextDays;
  }

  if (currentRestDays < targetRestDays) {
    let restNeeded = targetRestDays - currentRestDays;
    for (let index = nextDays.length - 1; index >= 0 && restNeeded > 0; index -= 1) {
      const day = nextDays[index];
      if (day.isRestDay) {
        continue;
      }
      nextDays[index] = {
        ...day,
        label: "Rest",
        workoutTemplateId: null,
        isRestDay: true,
      };
      restNeeded -= 1;
    }
    return nextDays;
  }

  const trainingPool = nextDays
    .filter((day) => !day.isRestDay && day.workoutTemplateId)
    .map((day) => {
      const template = templates.find((entry) => entry.id === day.workoutTemplateId) || null;
      return {
        label: template?.name || day.label || "Workout",
        workoutTemplateId: template?.id || day.workoutTemplateId || null,
      };
    });

  if (!trainingPool.length) {
    return nextDays;
  }

  let poolIndex = 0;
  let restsToFill = currentRestDays - targetRestDays;
  for (let index = 0; index < nextDays.length && restsToFill > 0; index += 1) {
    const day = nextDays[index];
    if (!day.isRestDay) {
      continue;
    }
    const replacement = trainingPool[poolIndex % trainingPool.length];
    poolIndex += 1;
    nextDays[index] = {
      ...day,
      label: replacement.label,
      workoutTemplateId: replacement.workoutTemplateId,
      isRestDay: false,
    };
    restsToFill -= 1;
  }

  return nextDays;
};

const getScheduleIndexForDate = (activeSplit, targetDate) => {
  const scheduledDays = activeSplit?.scheduledDays || [];
  if (!scheduledDays.length) {
    return 0;
  }
  const normalizedTarget = new Date(targetDate);
  normalizedTarget.setHours(0, 0, 0, 0);
  const anchorDate = activeSplit?.createdAt ? new Date(activeSplit.createdAt) : new Date();
  const anchorWeekStart = getStartOfWeek(anchorDate);
  anchorWeekStart.setHours(0, 0, 0, 0);
  const diffInDays = Math.round((normalizedTarget.getTime() - anchorWeekStart.getTime()) / (1000 * 60 * 60 * 24));
  return ((diffInDays % scheduledDays.length) + scheduledDays.length) % scheduledDays.length;
};

const getScheduledDayForDate = (activeSplit, dateKeyOrDate) => {
  if (!activeSplit) {
    return null;
  }
  const targetDate = dateKeyOrDate instanceof Date ? dateKeyOrDate : parseDateKey(dateKeyOrDate);
  const scheduledDays = activeSplit.scheduledDays || [];
  if (!scheduledDays.length) {
    return null;
  }
  return scheduledDays[getScheduleIndexForDate(activeSplit, targetDate)] || null;
};

const getTodayScheduledWorkout = (activeSplit, dateKey, templates = []) => {
  if (!activeSplit) {
    return null;
  }
  const scheduledDay = getScheduledDayForDate(activeSplit, dateKey);
  if (!scheduledDay) {
    return null;
  }
  const template = scheduledDay.workoutTemplateId
    ? templates.find((entry) => entry.id === scheduledDay.workoutTemplateId) || null
    : null;
  return {
    scheduledDay,
    template,
  };
};

const getWeeklyCompletionStats = (weekDates, activeSplit, completedWorkouts = []) => {
  if (!activeSplit) {
    return { completed: 0, total: 0, percent: 0 };
  }
  const completedSet = new Set((completedWorkouts || []).map((workout) => workout.dateKey));
  let completed = 0;
  let total = 0;

  weekDates.forEach((date) => {
    const scheduledDay = getScheduledDayForDate(activeSplit, date);
    if (!scheduledDay || scheduledDay.isRestDay) {
      return;
    }
    total += 1;
    if (completedSet.has(getDateKey(date))) {
      completed += 1;
    }
  });

  return {
    completed,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
};

const hasWorkoutTemplateChanges = (template, workout) => {
  if (!template || !workout) {
    return false;
  }

  if (template.exercises.length !== workout.exercises.length) {
    return true;
  }

  return template.exercises.some((templateExercise, index) => {
    const workoutExercise = workout.exercises[index];
    if (!workoutExercise) {
      return true;
    }

    if (templateExercise.exerciseId !== workoutExercise.exerciseId) {
      return true;
    }

    if (Number(templateExercise.defaultSets) !== Number(workoutExercise.sets.length)) {
      return true;
    }

    return false;
  });
};

const createCompletedWorkout = ({ id, templateId = null, name, startedAt, completedAt, exercises }) => ({
  id: id || `completed-workout-${Date.now()}`,
  templateId,
  name,
  startedAt,
  completedAt,
  dateKey: getDateKey(new Date(completedAt)),
  exercises: exercises.map((exercise) => ({
    id: exercise.id,
    exerciseId: exercise.exerciseId,
    name: exercise.name,
    sets: exercise.sets.map((set, index) => ({
      id: set.id,
      setNumber: index + 1,
      setType: set.setType || "normal",
      previous: set.previous || "--",
      weight: set.weight || "",
      reps: set.reps || "",
      completed: Boolean(set.completed),
    })),
  })),
});

const createCompletedWorkoutRecord = ({ id, templateId = null, name, startedAt, completedAt, exercises, summary = null }) => {
  const normalizedWorkout = createCompletedWorkout({
    id,
    templateId,
    name,
    startedAt,
    completedAt,
    exercises,
  });

  return {
    ...normalizedWorkout,
    summary: summary || buildWorkoutSummary(normalizedWorkout, [], completedAt),
  };
};

const normalizeCompletedWorkoutRecord = (workout) =>
  createCompletedWorkoutRecord({
    id: workout?.id,
    templateId: workout?.templateId || null,
    name: workout?.name || "Workout",
    startedAt: workout?.startedAt || new Date().toISOString(),
    completedAt: workout?.completedAt || workout?.startedAt || new Date().toISOString(),
    exercises: Array.isArray(workout?.exercises) ? workout.exercises : [],
    summary: workout?.summary || null,
  });

const placeholderCompletedWorkoutId = "completed-back-biceps-2026-04-26-0830";
const isPlaceholderCompletedWorkout = (workout) => workout?.id === placeholderCompletedWorkoutId;

const buildPlaceholderCompletedWorkout = () =>
  createCompletedWorkoutRecord({
    id: placeholderCompletedWorkoutId,
    templateId: "back-and-biceps",
    name: "Back & Biceps",
    startedAt: "2026-04-26T08:30:00.000-05:00",
    completedAt: "2026-04-26T09:18:00.000-05:00",
    exercises: [
      {
        id: "completed-exercise-1",
        exerciseId: "wide-grip-lat-pulldown",
        name: "Wide-Grip Lat Pulldown",
        sets: [
          { id: "a1", previous: "--", weight: "120", reps: "10", completed: true },
          { id: "a2", previous: "--", weight: "130", reps: "8", completed: true },
          { id: "a3", previous: "--", weight: "130", reps: "8", completed: true },
        ],
      },
      {
        id: "completed-exercise-2",
        exerciseId: "seated-cable-row",
        name: "Seated Cable Row",
        sets: [
          { id: "b1", previous: "--", weight: "110", reps: "12", completed: true },
          { id: "b2", previous: "--", weight: "120", reps: "10", completed: true },
          { id: "b3", previous: "--", weight: "120", reps: "10", completed: true },
        ],
      },
      {
        id: "completed-exercise-3",
        exerciseId: "chest-supported-t-bar-row",
        name: "Chest-Supported T-Bar Row",
        sets: [
          { id: "c1", previous: "--", weight: "80", reps: "10", completed: true },
          { id: "c2", previous: "--", weight: "90", reps: "8", completed: true },
          { id: "c3", previous: "--", weight: "90", reps: "8", completed: true },
        ],
      },
      {
        id: "completed-exercise-4",
        exerciseId: "barbell-curl",
        name: "Barbell Curl",
        sets: [
          { id: "d1", previous: "--", weight: "60", reps: "10", completed: true },
          { id: "d2", previous: "--", weight: "60", reps: "9", completed: true },
          { id: "d3", previous: "--", weight: "50", reps: "12", completed: true },
        ],
      },
      {
        id: "completed-exercise-5",
        exerciseId: "incline-dumbbell-curl",
        name: "Incline Dumbbell Curl",
        sets: [
          { id: "e1", previous: "--", weight: "25", reps: "10", completed: true },
          { id: "e2", previous: "--", weight: "25", reps: "10", completed: true },
          { id: "e3", previous: "--", weight: "20", reps: "12", completed: true },
        ],
      },
    ],
  });

const demoAccountEmail = "tosantenumah96@gmail.com";

const getDemoSetWeight = (exerciseName = "", workoutIndex = 0, setIndex = 0) => {
  const name = exerciseName.toLowerCase();
  const wave = (workoutIndex % 4) * 2.5 + setIndex * 5;
  if (name.includes("squat") || name.includes("rack pull") || name.includes("deadlift")) return 185 + wave;
  if (name.includes("leg press") || name.includes("pendulum") || name.includes("hack")) return 270 + wave * 2;
  if (name.includes("bench") || name.includes("press")) return name.includes("dumbbell") ? 70 + wave : 155 + wave;
  if (name.includes("pulldown") || name.includes("row")) return 125 + wave;
  if (name.includes("curl")) return 35 + setIndex * 2.5 + (workoutIndex % 3) * 2.5;
  if (name.includes("pushdown") || name.includes("extension")) return 55 + wave;
  if (name.includes("lateral") || name.includes("fly") || name.includes("rear")) return 25 + setIndex * 2.5;
  if (name.includes("calf")) return 140 + wave;
  if (name.includes("extension")) return 95 + wave;
  return 80 + wave;
};

const buildDemoCompletedWorkouts = (endDateKey = getDateKey(), templates = []) => {
  const schedule = [
    { offset: 13, template: "Push Day" },
    { offset: 12, template: "Pull Day" },
    { offset: 11, template: "Leg Day" },
    { offset: 9, template: "Push Day" },
    { offset: 8, template: "Pull Day" },
    { offset: 7, template: "Quad-Focused Leg Day" },
    { offset: 6, template: "Push Day" },
    { offset: 5, template: "Pull Day" },
    { offset: 4, template: "Hamstring-Focused Leg Day" },
    { offset: 2, template: "Push Day" },
    { offset: 1, template: "Pull Day" },
  ];

  return schedule.map((item, workoutIndex) => {
    const template = templates.find((entry) => entry.name === item.template) || getWorkoutTemplateForSplitLabel(item.template, templates);
    const dateKey = shiftDateKey(endDateKey, -item.offset);
    const startedAt = `${dateKey}T18:${String((workoutIndex * 7) % 50).padStart(2, "0")}:00.000`;
    const completedAt = `${dateKey}T19:${String(10 + ((workoutIndex * 5) % 45)).padStart(2, "0")}:00.000`;
    const exercises = (template?.exercises || []).slice(0, 6).map((exercise, exerciseIndex) => ({
      ...exercise,
      id: `demo-completed-exercise-${workoutIndex}-${exerciseIndex}`,
      sets: (exercise.sets || []).slice(0, Math.max(exercise.defaultSets || 3, 2)).map((set, setIndex) => ({
        id: `demo-set-${workoutIndex}-${exerciseIndex}-${setIndex}`,
        setNumber: setIndex + 1,
        setType: "normal",
        previous: "--",
        weight: String(Math.round(getDemoSetWeight(exercise.name, workoutIndex, setIndex))),
        reps: String(setIndex === 0 ? 12 : setIndex === 1 ? 10 : 8),
        completed: true,
      })),
    }));

    return createCompletedWorkoutRecord({
      id: `demo-${dateKey}-${String(template?.id || item.template).replace(/^preset-/, "")}`,
      templateId: template?.id || null,
      name: template?.name || item.template,
      startedAt,
      completedAt,
      exercises,
    });
  });
};

const buildDemoCheckIns = (endDateKey = getDateKey()) =>
  Array.from({ length: 14 }, (_, index) => {
    const dateKey = shiftDateKey(endDateKey, -(13 - index));
    return normalizeCheckInEntry({
      id: `demo-check-in-${dateKey}`,
      dateKey,
      weightLbs: Number((188.4 + index * 0.13 + Math.sin(index) * 0.28).toFixed(1)),
      sleepHours: sleepPlaceholderByDateOffset[index % sleepPlaceholderByDateOffset.length],
      notes: "Demo bodyweight entry",
      photos: [],
    });
  });

function AddFoodModal({
  visible,
  meal,
  favorites,
  loggedFoods,
  customMeals,
  customFoods,
  onClose,
  onAddFood,
  onToggleFavorite,
  onSaveCustomMeal,
  onSaveCustomFood,
  onDeleteFavorite,
  onDeleteCustomMeal,
  onDeleteCustomFood,
  onKeyboardStateChange,
}) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef(null);
  const focusTimeoutRef = useRef(null);
  const interactionHandleRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const searchAbortControllerRef = useRef(null);
  const latestSearchRequestRef = useRef(0);
  const barcodeScanRequestRef = useRef(0);
  const barcodeProcessingRef = useRef(false);
  const cameraPermissionRequestRef = useRef(null);
  const renderBarcodeGlyph = () => (
    <View style={styles.barcodeIconWrap}>
      <View style={[styles.barcodeIconBar, styles.barcodeIconBarThick]} />
      <View style={[styles.barcodeIconBar, styles.barcodeIconBarThin]} />
      <View style={[styles.barcodeIconBar, styles.barcodeIconBarMedium]} />
      <View style={[styles.barcodeIconBar, styles.barcodeIconBarThin]} />
      <View style={[styles.barcodeIconBar, styles.barcodeIconBarWide]} />
      <View style={[styles.barcodeIconBar, styles.barcodeIconBarThin]} />
      <View style={[styles.barcodeIconBar, styles.barcodeIconBarMedium]} />
    </View>
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedFoodOrigin, setSelectedFoodOrigin] = useState(null);
  const [deleteActionArmed, setDeleteActionArmed] = useState(false);
  const [deletingMealId, setDeletingMealId] = useState(null);
  const [selectedServingId, setSelectedServingId] = useState("");
  const [amount, setAmount] = useState("1");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [providerLabel, setProviderLabel] = useState("FS Food Data");
  const [setupMessage, setSetupMessage] = useState(DEFAULT_SEARCH_MESSAGE);
  const [scanVisible, setScanVisible] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanBusy, setScanBusy] = useState(false);
  const [hasScannedBarcode, setHasScannedBarcode] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(DEFAULT_TORCH_ENABLED);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scanTarget, setScanTarget] = useState("main");
  const [customMealVisible, setCustomMealVisible] = useState(false);
  const [creatorMenuVisible, setCreatorMenuVisible] = useState(false);
  const [customMealName, setCustomMealName] = useState("");
  const [customMealIngredients, setCustomMealIngredients] = useState([]);
  const [customIngredientFood, setCustomIngredientFood] = useState(null);
  const [customIngredientServingId, setCustomIngredientServingId] = useState("");
  const [customIngredientAmount, setCustomIngredientAmount] = useState("1");
  const [customSearchTerm, setCustomSearchTerm] = useState("");
  const [customSearchResults, setCustomSearchResults] = useState([]);
  const [customSearchLoading, setCustomSearchLoading] = useState(false);
  const [customSearchError, setCustomSearchError] = useState("");
  const customSearchDebounceRef = useRef(null);
  const customSearchAbortControllerRef = useRef(null);
  const latestCustomSearchRequestRef = useRef(0);
  const [customFoodVisible, setCustomFoodVisible] = useState(false);
  const [customFoodName, setCustomFoodName] = useState("");
  const [customFoodCalories, setCustomFoodCalories] = useState("");
  const [customFoodProtein, setCustomFoodProtein] = useState("");
  const [customFoodCarbs, setCustomFoodCarbs] = useState("");
  const [customFoodFat, setCustomFoodFat] = useState("");
  const [customFoodError, setCustomFoodError] = useState("");

  const resetDraft = () => {
    setSelectedFood(null);
    setSelectedFoodOrigin(null);
    setDeleteActionArmed(false);
    setSelectedServingId("");
    setAmount("1");
  };

  const resetCustomMealDraft = () => {
    setCustomMealName("");
    setCustomMealIngredients([]);
    setCustomIngredientFood(null);
    setCustomIngredientServingId("");
    setCustomIngredientAmount("1");
    setCustomSearchTerm("");
    setCustomSearchResults([]);
    setCustomSearchLoading(false);
    setCustomSearchError("");
    setCustomMealVisible(false);
  };

  const resetCustomFoodDraft = () => {
    setCustomFoodName("");
    setCustomFoodCalories("");
    setCustomFoodProtein("");
    setCustomFoodCarbs("");
    setCustomFoodFat("");
    setCustomFoodError("");
    setCustomFoodVisible(false);
  };

  const animateAddFoodTransition = () => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const openCreator = (type) => {
    Keyboard.dismiss();
    animateAddFoodTransition();
    setCreatorMenuVisible(false);
    resetDraft();
    if (type === "meal") {
      resetCustomFoodDraft();
      setCustomMealVisible(true);
      return;
    }
    resetCustomMealDraft();
    setCustomFoodVisible(true);
  };

  useEffect(() => {
    if (!visible) {
      setSearchTerm("");
      setActiveTab("all");
      setSearchResults([]);
      setSearchError("");
      setSearchLoading(false);
      setDetailLoading(false);
      setDeletingMealId(null);
      setProviderLabel("FS Food Data");
      setSetupMessage(DEFAULT_SEARCH_MESSAGE);
      setScanVisible(false);
      setScanError("");
      setScanBusy(false);
      setHasScannedBarcode(false);
      barcodeProcessingRef.current = false;
      setScanTarget("main");
      setTorchEnabled(DEFAULT_TORCH_ENABLED);
      setCreatorMenuVisible(false);
      resetCustomMealDraft();
      resetCustomFoodDraft();
      resetDraft();
      onKeyboardStateChange(false);
      return undefined;
    }

    interactionHandleRef.current = InteractionManager.runAfterInteractions(() => {
      focusTimeoutRef.current = setTimeout(() => {
        inputRef.current?.focus();
      }, 120);
    });

    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      onKeyboardStateChange(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      onKeyboardStateChange(false);
    });

    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      searchAbortControllerRef.current?.abort();
      if (customSearchDebounceRef.current) {
        clearTimeout(customSearchDebounceRef.current);
      }
      customSearchAbortControllerRef.current?.abort();
      interactionHandleRef.current?.cancel?.();
      showSubscription.remove();
      hideSubscription.remove();
      onKeyboardStateChange(false);
    };
  }, [visible, onKeyboardStateChange]);

  useEffect(() => {
    if (!visible || activeTab !== "all" || selectedFood) {
      return undefined;
    }

    const trimmedTerm = searchTerm.trim();
    if (!trimmedTerm) {
      searchAbortControllerRef.current?.abort();
      setSearchResults([]);
      setSearchError("");
      setSearchLoading(false);
      setSetupMessage(DEFAULT_SEARCH_MESSAGE);
      return undefined;
    }

    if (trimmedTerm.length < LIVE_SEARCH_MIN_QUERY_LENGTH) {
      searchAbortControllerRef.current?.abort();
      const fallbackPayload = searchLocalFoods(trimmedTerm);
      setSearchResults(fallbackPayload.results);
      setProviderLabel("Suggestions");
      setSearchError("");
      setSearchLoading(false);
      setSetupMessage("Keep typing to search FS Food Data. Showing quick local suggestions for now.");
      return undefined;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(async () => {
      const requestId = Date.now();
      latestSearchRequestRef.current = requestId;
      searchAbortControllerRef.current?.abort();
      searchAbortControllerRef.current = new AbortController();
      setSearchLoading(true);
      setSearchError("");

      try {
        const payload = await searchFoodsFromProxy(trimmedTerm, searchAbortControllerRef.current.signal);
        if (latestSearchRequestRef.current !== requestId) {
          return;
        }

        const fallbackPayload = searchLocalFoods(trimmedTerm);
        const mergedResults = mergeSearchResults(payload.results, fallbackPayload.results, 20, trimmedTerm);
        const usingSuggestions = !payload.results.length && fallbackPayload.results.length;

        setSearchResults(mergedResults);
        setProviderLabel(usingSuggestions ? "Smart suggestions" : payload.providerLabel);
        setSetupMessage(
          usingSuggestions
            ? "No exact live matches found. Showing nearby suggestions while you type."
            : payload.setupMessage
        );
        logAppInfo({
          source: "fatsecret",
          action: "search-results",
          userMessage: "Food search returned results.",
          details: { query: trimmedTerm, resultCount: mergedResults.length, provider: payload.provider },
        });
      } catch (error) {
        if (latestSearchRequestRef.current !== requestId) {
          return;
        }

        if (error?.name === "AbortError") {
          return;
        }

        const fallbackPayload = searchLocalFoods(trimmedTerm);
        setSearchResults(fallbackPayload.results);
        setProviderLabel(fallbackPayload.providerLabel);
        setSetupMessage(fallbackPayload.setupMessage);
        setSearchError(error?.message || "Unable to reach FS Food Data right now.");
        logAppError({
          source: "fatsecret",
          action: "search-results",
          userMessage: "Food search failed, using local suggestions.",
          error,
          details: { query: trimmedTerm },
        });
      } finally {
        if (latestSearchRequestRef.current === requestId) {
          setSearchLoading(false);
        }
      }
    }, 220);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      searchAbortControllerRef.current?.abort();
    };
  }, [activeTab, searchTerm, selectedFood, visible]);

  useEffect(() => {
    if (!visible || !customMealVisible) {
      return undefined;
    }

    const trimmedTerm = customSearchTerm.trim();
    if (!trimmedTerm) {
      customSearchAbortControllerRef.current?.abort();
      setCustomSearchResults([]);
      setCustomSearchError("");
      setCustomSearchLoading(false);
      return undefined;
    }

    if (trimmedTerm.length < LIVE_SEARCH_MIN_QUERY_LENGTH) {
      customSearchAbortControllerRef.current?.abort();
      const fallbackPayload = searchLocalFoods(trimmedTerm);
      setCustomSearchResults(fallbackPayload.results);
      setCustomSearchError("");
      setCustomSearchLoading(false);
      return undefined;
    }

    if (customSearchDebounceRef.current) {
      clearTimeout(customSearchDebounceRef.current);
    }

    customSearchDebounceRef.current = setTimeout(async () => {
      const requestId = Date.now();
      latestCustomSearchRequestRef.current = requestId;
      customSearchAbortControllerRef.current?.abort();
      customSearchAbortControllerRef.current = new AbortController();
      setCustomSearchLoading(true);
      setCustomSearchError("");

      try {
        const payload = await searchFoodsFromProxy(trimmedTerm, customSearchAbortControllerRef.current.signal);
        if (latestCustomSearchRequestRef.current !== requestId) {
          return;
        }

        const fallbackPayload = searchLocalFoods(trimmedTerm);
        setCustomSearchResults(mergeSearchResults(payload.results, fallbackPayload.results, 20, trimmedTerm));
        logAppInfo({
          source: "fatsecret",
          action: "ingredient-search-results",
          userMessage: "Ingredient search returned results.",
          details: { query: trimmedTerm, provider: payload.provider },
        });
      } catch (error) {
        if (latestCustomSearchRequestRef.current !== requestId) {
          return;
        }

        if (error?.name === "AbortError") {
          return;
        }

        const fallbackPayload = searchLocalFoods(trimmedTerm);
        setCustomSearchResults(fallbackPayload.results);
        setCustomSearchError(error?.message || "Unable to search FS Food Data ingredients right now.");
        logAppError({
          source: "fatsecret",
          action: "ingredient-search-results",
          userMessage: "Ingredient search failed, using local suggestions.",
          error,
          details: { query: trimmedTerm },
        });
      } finally {
        if (latestCustomSearchRequestRef.current === requestId) {
          setCustomSearchLoading(false);
        }
      }
    }, 220);

    return () => {
      if (customSearchDebounceRef.current) {
        clearTimeout(customSearchDebounceRef.current);
      }
      customSearchAbortControllerRef.current?.abort();
    };
  }, [customMealVisible, customSearchTerm, visible]);

  const myMeals = useMemo(() => {
    const seen = new Set();
    const customMealFoods = customMeals.filter((food) => {
      const key = `custom:${food.id}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
    const loggedMealFoods = loggedFoods
      .map(createFoodFromLoggedEntry)
      .filter((food) => {
        const key = `logged:${food.id}:${food.servings[0]?.label || ""}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    return [...customMealFoods, ...loggedMealFoods];
  }, [customMeals, loggedFoods]);

  const visibleFoods = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (activeTab === "all") {
      return searchResults;
    }

    if (activeTab === "favorites") {
      return getRankedFoodMatches([...customFoods, ...favorites], term, 50);
    }

    if (activeTab === "my-meals") {
      return getRankedFoodMatches(myMeals, term, 50);
    }

    return [];
  }, [activeTab, customFoods, favorites, myMeals, searchResults, searchTerm]);

  const isFavorite = selectedFood ? [...customFoods, ...favorites].some((food) => food.id === selectedFood.id) : false;

  const runSubmittedFoodSearch = async () => {
    const trimmedTerm = searchTerm.trim();
    if (!trimmedTerm) {
      return;
    }

    Keyboard.dismiss();
    searchAbortControllerRef.current?.abort();
    const requestId = Date.now();
    latestSearchRequestRef.current = requestId;
    searchAbortControllerRef.current = new AbortController();
    animateAddFoodTransition();
    resetDraft();
    setActiveTab("all");
    setCreatorMenuVisible(false);
    setSearchResults([]);
    setSearchError("");
    setSearchLoading(true);
    setSetupMessage("Searching foods...");

    try {
      const payload = trimmedTerm.length >= LIVE_SEARCH_MIN_QUERY_LENGTH
        ? await searchFoodsFromProxy(trimmedTerm, searchAbortControllerRef.current.signal)
        : searchLocalFoods(trimmedTerm);
      if (latestSearchRequestRef.current !== requestId) {
        return;
      }

      const fallbackPayload = searchLocalFoods(trimmedTerm);
      const mergedResults = mergeSearchResults(payload.results || [], fallbackPayload.results, 20, trimmedTerm);
      const usingSuggestions = !payload.results?.length && fallbackPayload.results.length;
      setSearchResults(mergedResults);
      setProviderLabel(usingSuggestions ? "Smart suggestions" : payload.providerLabel || "FS Food Data");
      setSetupMessage(
        usingSuggestions
          ? "No exact live matches found. Showing nearby suggestions while you type."
          : payload.setupMessage || DEFAULT_SEARCH_MESSAGE
      );
      logAppInfo({
        source: "fatsecret",
        action: "submitted-search-results",
        userMessage: "Submitted food search returned results.",
        details: { query: trimmedTerm, resultCount: mergedResults.length, provider: payload.provider || "sample" },
      });
    } catch (error) {
      if (latestSearchRequestRef.current !== requestId || error?.name === "AbortError") {
        return;
      }
      const fallbackPayload = searchLocalFoods(trimmedTerm);
      setSearchResults(fallbackPayload.results);
      setProviderLabel(fallbackPayload.providerLabel);
      setSetupMessage(fallbackPayload.setupMessage);
      setSearchError(error?.message || "Unable to reach FS Food Data right now.");
      logAppError({
        source: "fatsecret",
        action: "submitted-search-results",
        userMessage: "Submitted food search failed, using local suggestions.",
        error,
        details: { query: trimmedTerm },
      });
    } finally {
      if (latestSearchRequestRef.current === requestId) {
        setSearchLoading(false);
      }
    }
  };

  const handlePickFood = async (food) => {
    Keyboard.dismiss();
    setSearchError("");
    setDeleteActionArmed(false);

    if (food.source === "fatsecret") {
      setDetailLoading(true);
      try {
        const detailedFood = await fetchFoodDetailFromProxy(food.id);
        animateAddFoodTransition();
        setSelectedFood(detailedFood);
        setSelectedFoodOrigin({ tab: activeTab, source: food.source, id: food.id, name: food.name });
        setSelectedServingId(detailedFood.servings[0]?.id || "");
        setAmount("1");
      } catch (error) {
        setSearchError(error?.message || "Unable to load nutrition data for that food.");
      } finally {
        setDetailLoading(false);
      }
      return;
    }

    const localFood = getSampleFoodById(food.id) || food;
    if (!localFood) {
      setSearchError("Food could not be found.");
      return;
    }

    animateAddFoodTransition();
    setSelectedFood(localFood);
    setSelectedFoodOrigin({ tab: activeTab, source: localFood.source || food.source || "sample", id: localFood.id, name: localFood.name });
    setSelectedServingId(localFood.servings[0]?.id || "");
    setAmount("1");
  };
  const selectedNutrition = useMemo(() => {
    if (!selectedFood) {
      return null;
    }

    const serving = selectedFood.servings.find((item) => item.id === selectedServingId) || selectedFood.servings[0];
    const quantity = Math.max(Number.parseFloat(amount) || 1, 0.25);
    const servingNutrition = getServingNutrition(selectedFood, serving);

    return {
      calories: Number((servingNutrition.calories * quantity).toFixed(1)),
      protein: Number((servingNutrition.protein * quantity).toFixed(1)),
      carbs: Number((servingNutrition.carbs * quantity).toFixed(1)),
      fat: Number((servingNutrition.fat * quantity).toFixed(1)),
      micros: scaleMicros(servingNutrition.micros, quantity),
    };
  }, [amount, selectedFood, selectedServingId]);

  const openBarcodeScanner = async () => {
    Keyboard.dismiss();
    setScanError("");
    setHasScannedBarcode(false);
    barcodeProcessingRef.current = false;
    setTorchEnabled(DEFAULT_TORCH_ENABLED);
    setScanVisible(true);

    if (!cameraPermission?.granted) {
      try {
        cameraPermissionRequestRef.current = cameraPermissionRequestRef.current || requestCameraPermission();
        const permissionResponse = await cameraPermissionRequestRef.current;
        cameraPermissionRequestRef.current = null;
        if (!permissionResponse.granted) {
          setScanError("Camera permission is required to scan barcodes.");
        }
      } catch (error) {
        cameraPermissionRequestRef.current = null;
        setScanError("Camera permission could not be checked.");
        logAppError({
          source: "barcode",
          action: "camera-permission",
          userMessage: "Camera permission check failed.",
          error,
        });
      }
    }
  };

  const handleBarcodeScanned = async ({ data }) => {
    if (!data || barcodeProcessingRef.current || scanBusy || hasScannedBarcode) {
      return;
    }

    const requestId = Date.now();
    barcodeProcessingRef.current = true;
    barcodeScanRequestRef.current = requestId;
    setHasScannedBarcode(true);
    setScanBusy(true);
    setScanError("");

    try {
      const scannedFood = await fetchFoodFromBarcode(data);
      if (barcodeScanRequestRef.current !== requestId) {
        return;
      }
      setScanError("");
      setScanVisible(false);
      if (scanTarget === "custom-meal") {
        animateAddFoodTransition();
        setCustomIngredientFood(scannedFood);
        setCustomIngredientServingId(scannedFood.servings[0]?.id || "");
        setCustomIngredientAmount("1");
      } else {
        animateAddFoodTransition();
        setSelectedFood(scannedFood);
        setSelectedFoodOrigin({ tab: activeTab, source: scannedFood.source, id: scannedFood.id, name: scannedFood.name });
        setSelectedServingId(scannedFood.servings[0]?.id || "");
        setAmount("1");
      }
    } catch (error) {
      if (barcodeScanRequestRef.current === requestId) {
        setScanError(error?.message || "Unable to find a product for that barcode.");
        setHasScannedBarcode(false);
        setScanVisible(true);
        barcodeProcessingRef.current = false;
      }
      logAppError({
        source: "barcode",
        action: "scan-lookup",
        userMessage: "Barcode lookup failed.",
        error,
        details: { barcode: data, target: scanTarget },
      });
    } finally {
      if (barcodeScanRequestRef.current === requestId) {
        setScanBusy(false);
        barcodeProcessingRef.current = false;
      }
    }
  };

  const handleConfirm = () => {
    if (!selectedFood) {
      return;
    }

    onAddFood(meal, createEntry(selectedFood, selectedServingId, amount));
    setSearchTerm("");
    setActiveTab("all");
    resetDraft();
    onClose();
  };

  const handlePickCustomIngredient = async (food) => {
    Keyboard.dismiss();
    setCustomSearchError("");

    if (food.source === "fatsecret") {
      setDetailLoading(true);
      try {
        const detailedFood = await fetchFoodDetailFromProxy(food.id);
        setCustomIngredientFood(detailedFood);
        setCustomIngredientServingId(detailedFood.servings[0]?.id || "");
        setCustomIngredientAmount("1");
      } catch (error) {
        setCustomSearchError(error?.message || "Unable to load ingredient details.");
      } finally {
        setDetailLoading(false);
      }
      return;
    }

    const localFood = getSampleFoodById(food.id) || food;
    animateAddFoodTransition();
    setCustomIngredientFood(localFood);
    setCustomIngredientServingId(localFood.servings[0]?.id || "");
    setCustomIngredientAmount("1");
  };

  const addIngredientToCustomMeal = () => {
    if (!customIngredientFood) {
      return;
    }

    const ingredientEntry = createEntry(customIngredientFood, customIngredientServingId, customIngredientAmount);
    setCustomMealIngredients((current) => [ingredientEntry, ...current]);
    setCustomIngredientFood(null);
    setCustomIngredientServingId("");
    setCustomIngredientAmount("1");
    setCustomSearchTerm("");
    setCustomSearchResults([]);
    setCustomSearchError("");
    Keyboard.dismiss();
  };

  const removeCustomIngredient = (entryId) => {
    setCustomMealIngredients((current) => current.filter((entry) => entry.id !== entryId));
  };

  const saveCustomMeal = () => {
    const trimmedName = customMealName.trim();
    if (!trimmedName || !customMealIngredients.length) {
      setCustomSearchError("Add a meal name and at least one ingredient before saving.");
      return;
    }

    const customMealFood = buildCustomMealFood(trimmedName, customMealIngredients);
    onSaveCustomMeal(customMealFood);
    resetCustomMealDraft();
    setActiveTab("my-meals");
  };

  const saveCustomFood = () => {
    const trimmedName = customFoodName.trim();
    const calories = Math.max(toNumber(customFoodCalories), 0);
    const protein = Math.max(toNumber(customFoodProtein), 0);
    const carbs = Math.max(toNumber(customFoodCarbs), 0);
    const fat = Math.max(toNumber(customFoodFat), 0);

    if (!trimmedName) {
      setCustomFoodError("Add a name before saving this food.");
      return;
    }

    const customFood = buildCustomFood({ name: trimmedName, calories, protein, carbs, fat });
    onSaveCustomFood(customFood);
    resetCustomFoodDraft();
    setActiveTab("favorites");
  };

  const canDeleteFromGroup = selectedFoodOrigin?.tab === "favorites" || selectedFoodOrigin?.tab === "my-meals";

  const confirmDeleteCustomMeal = (mealFood, options = {}) => {
    if (!mealFood?.id || deletingMealId === mealFood.id) {
      return;
    }

    const mealName = mealFood.name || "this meal";
    Alert.alert(
      "Delete meal?",
      `Delete "${mealName}" from My Meals? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            try {
              setDeletingMealId(mealFood.id);
              onDeleteCustomMeal(mealFood.id);
              if (options.resetSelected) {
                resetDraft();
              }
            } catch (error) {
              logAppError({
                source: "food",
                action: "delete-custom-meal",
                userMessage: "Meal could not be deleted.",
                error,
                details: { mealId: mealFood.id, mealName },
              });
              setSearchError("That meal could not be deleted. Try again.");
            } finally {
              setDeletingMealId(null);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleDeleteSelectedFood = () => {
    if (!selectedFoodOrigin) {
      return;
    }

    if (selectedFoodOrigin.tab === "my-meals" && selectedFoodOrigin.source === "custom-meal") {
      confirmDeleteCustomMeal(selectedFood, { resetSelected: true });
      return;
    }

    setDeleteActionArmed(true);
    setTimeout(() => {
      if (selectedFoodOrigin.tab === "favorites") {
        if (selectedFoodOrigin.source === "custom-food") {
          onDeleteCustomFood(selectedFoodOrigin.id);
        } else {
          onDeleteFavorite(selectedFoodOrigin.id);
        }
      }

      resetDraft();
    }, 140);
  };

  const renderMacroBar = (macro) => {
    const value = selectedNutrition?.[macro.key] ?? 0;
    const progress = Math.min((value / goals[macro.key]) * 100, 100);

    return (
      <View key={macro.key} style={styles.modalMacroRow}>
        <View style={styles.modalMacroCopy}>
          <Text style={styles.modalMacroLabel}>{macro.label}</Text>
          <Text style={styles.modalMacroValue}>
            {formatValue(value)} / {goals[macro.key]} {macro.unit}
          </Text>
        </View>
        <View style={styles.modalMacroTrack}>
          <View style={[styles.modalMacroFill, { width: `${progress}%`, backgroundColor: macro.color }]} />
        </View>
      </View>
    );
  };

  const selectedProminentMicros = useMemo(
    () => getMicronutrientList(selectedNutrition?.micros || {}, prominentMicronutrientKeys),
    [selectedNutrition]
  );

  const selectedAllMicros = useMemo(
    () => getMicronutrientList(selectedNutrition?.micros || {}),
    [selectedNutrition]
  );

  const renderCustomMealBuilder = () => (
    <>
      <TextInput
        value={customMealName}
        onChangeText={setCustomMealName}
        placeholder="Meal name"
        placeholderTextColor="#6f817b"
        style={styles.searchInput}
      />

      <View style={styles.searchRow}>
        <TextInput
          value={customSearchTerm}
          onChangeText={setCustomSearchTerm}
          placeholder="Search ingredients"
          placeholderTextColor="#6f817b"
          style={[styles.searchInput, styles.searchInputInline]}
        />
        <Pressable
          onPress={() => {
            setScanTarget("custom-meal");
            openBarcodeScanner();
          }}
          style={styles.addCustomMealButton}
        >
          {renderBarcodeGlyph()}
        </Pressable>
      </View>

      {customSearchError ? (
        <View style={styles.searchStatusCard}>
          <Text style={styles.searchStatusError}>{customSearchError}</Text>
        </View>
      ) : null}

      {customIngredientFood ? (
        <View style={styles.selectedFoodCard}>
          <View style={styles.selectedFoodHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedFoodName}>{customIngredientFood.name}</Text>
              <Text style={styles.selectedFoodBrand}>{customIngredientFood.brand || "Ingredient"}</Text>
            </View>
          </View>

          <View style={styles.selectionRow}>
            <View style={styles.selectionField}>
              <Text style={styles.selectionLabel}>Serving Size</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {customIngredientFood.servings.map((serving) => (
                  <Pressable
                    key={serving.id}
                    onPress={() => setCustomIngredientServingId(serving.id)}
                    style={[styles.servingChip, customIngredientServingId === serving.id && styles.servingChipActive]}
                  >
                    <Text style={[styles.servingChipText, customIngredientServingId === serving.id && styles.servingChipTextActive]}>
                      {serving.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.selectionField}>
            <Text style={styles.selectionLabel}>Quantity</Text>
            <TextInput
              value={customIngredientAmount}
              onChangeText={setCustomIngredientAmount}
              keyboardType="decimal-pad"
              style={styles.quantityInput}
            />
          </View>

          <View style={styles.modalButtonRow}>
            <Pressable onPress={() => setCustomIngredientFood(null)} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>X</Text>
            </Pressable>
            <Pressable onPress={addIngredientToCustomMeal} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>+ Add Ingredient</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <ScrollView style={styles.modalResults} contentContainerStyle={styles.modalResultsContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {!customIngredientFood && customSearchTerm.trim() ? (
          customSearchLoading ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>Searching ingredients...</Text>
            </View>
          ) : customSearchResults.length ? (
            customSearchResults.map((food) => (
              <Pressable key={`${food.source || "sample"}-${food.id}`} onPress={() => handlePickCustomIngredient(food)} style={styles.foodResultCard}>
                <View style={styles.foodResultCopy}>
                  <Text style={styles.foodResultName}>{food.name}</Text>
                  <Text style={styles.foodResultMeta}>{food.brand || "Ingredient"}</Text>
                </View>
                <Text style={styles.foodResultCalories}>
                  {food.macros?.calories != null ? `${formatValue(food.macros.calories)} kcal` : "Select"}
                </Text>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No ingredient matches yet.</Text>
            </View>
          )
        ) : null}

        <View style={styles.customMealSectionHeader}>
          <Text style={styles.cardTitle}>Ingredients</Text>
          <Text style={styles.cardSubtle}>{customMealIngredients.length} added</Text>
        </View>

        {customMealIngredients.length ? (
          customMealIngredients.map((entry) => (
            <View key={entry.id} style={styles.mealEntry}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mealEntryTitle}>{entry.foodName}</Text>
                <Text style={styles.mealEntryMeta}>{entry.amount} x {entry.unitLabel}</Text>
              </View>
              <Text style={styles.mealEntryCalories}>{formatValue(entry.calories)} kcal</Text>
              <Pressable onPress={() => removeCustomIngredient(entry.id)} style={({ pressed }) => [styles.removeIconButton, pressed && styles.removeIconButtonPressed]}>
                {({ pressed }) => (
                  <Image
                    source={trashActionIcon}
                    resizeMode="contain"
                    style={[styles.removeIconImage, { tintColor: pressed ? "#ff6b6b" : theme.textMuted }]}
                  />
                )}
              </Pressable>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Search and add ingredients to build your meal.</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.modalButtonRow}>
        <Pressable onPress={resetCustomMealDraft} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
        <Pressable onPress={saveCustomMeal} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Save Meal</Text>
        </Pressable>
      </View>
    </>
  );

  const renderCustomFoodBuilder = () => (
    <>
      <TextInput
        value={customFoodName}
        onChangeText={(value) => {
          setCustomFoodName(value);
          if (customFoodError) {
            setCustomFoodError("");
          }
        }}
        placeholder="Food name"
        placeholderTextColor="#6f817b"
        style={styles.searchInput}
      />

      <View style={styles.selectedFoodCard}>
        <Text style={styles.cardTitle}>Macros Per Serving</Text>
        <View style={styles.manualMacroGrid}>
          {[
            ["Calories", customFoodCalories, setCustomFoodCalories],
            ["Protein", customFoodProtein, setCustomFoodProtein],
            ["Carbs", customFoodCarbs, setCustomFoodCarbs],
            ["Fat", customFoodFat, setCustomFoodFat],
          ].map(([label, value, setter]) => (
            <View key={label} style={styles.manualMacroField}>
              <Text style={styles.selectionLabel}>{label}</Text>
              <TextInput
                value={value}
                onChangeText={(nextValue) => {
                  setter(nextValue);
                  if (customFoodError) {
                    setCustomFoodError("");
                  }
                }}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#6f817b"
                style={styles.quantityInput}
              />
            </View>
          ))}
        </View>
        {customFoodError ? <Text style={styles.searchStatusError}>{customFoodError}</Text> : null}
      </View>

      <View style={styles.modalButtonRow}>
        <Pressable onPress={resetCustomFoodDraft} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
        <Pressable onPress={saveCustomFood} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Save Food</Text>
        </Pressable>
      </View>
    </>
  );

  return (
    <Modal animationType="slide" presentationStyle="fullScreen" visible={visible} onRequestClose={onClose}>
        <SafeAreaView style={styles.modalSafeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalKeyboard}
          >
          <View style={styles.modalHeader}>
              <View>
                <Text style={styles.eyebrow}>
                  {customMealVisible || customFoodVisible ? "My Meals" : meal}
                </Text>
                <Text style={styles.modalTitle}>
                  {customMealVisible ? "Create Meal" : customFoodVisible ? "Create Food" : "Add Food"}
                </Text>
              </View>
              <Pressable
                onPress={customMealVisible ? resetCustomMealDraft : customFoodVisible ? resetCustomFoodDraft : onClose}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseButtonText}>{customMealVisible || customFoodVisible ? "Back" : "Close"}</Text>
              </Pressable>
              </View>

              {!customMealVisible && !customFoodVisible ? (
              <>
                <View style={styles.tabRowWrap}>
              <View style={styles.tabRow}>
                {["favorites", "all", "my-meals"].map((tab) => (
                  <Pressable
                    key={tab}
                    onPress={() => {
                      Keyboard.dismiss();
                      animateAddFoodTransition();
                      setCreatorMenuVisible(false);
                      if (selectedFood) {
                        resetDraft();
                        setDetailLoading(false);
                      }
                      setActiveTab(tab);
                    }}
                    style={({ pressed }) => [
                      styles.filterTab,
                      activeTab === tab && styles.filterTabActive,
                      pressed && styles.darkPressablePressed,
                    ]}
                  >
                    <Text style={[styles.filterTabText, activeTab === tab && styles.filterTabTextActive]}>
                      {tab === "favorites" ? "Favorites" : tab === "my-meals" ? "My Meals" : "All"}
                    </Text>
                  </Pressable>
                ))}

              <Pressable
                onPress={() => {
                  animateAddFoodTransition();
                  setScanTarget("main");
                  openBarcodeScanner();
                }}
                style={({ pressed }) => [styles.scanButton, pressed && styles.darkPressablePressed]}
              >
                {renderBarcodeGlyph()}
              </Pressable>
            </View>
          </View>

                <View style={styles.searchRow}>
              <TextInput
                ref={inputRef}
                autoFocus
                value={searchTerm}
                onChangeText={setSearchTerm}
                onSubmitEditing={selectedFood ? runSubmittedFoodSearch : undefined}
                placeholder="Search"
                placeholderTextColor="#6f817b"
                style={[styles.searchInput, styles.searchInputInline]}
                returnKeyType="search"
              />
              {activeTab === "my-meals" ? (
                <Pressable
                  onPress={() => {
                    Keyboard.dismiss();
                    setCreatorMenuVisible((current) => !current);
                  }}
                  style={styles.addCustomMealButton}
                >
                  <Text style={styles.addCustomMealButtonText}>+</Text>
                </Pressable>
              ) : null}
            </View>

            {activeTab === "my-meals" && creatorMenuVisible ? (
              <View style={styles.creatorMenuCard}>
                <Pressable onPress={() => openCreator("meal")} style={styles.creatorMenuButton}>
                  <Text style={styles.creatorMenuTitle}>Create Meal</Text>
                  <Text style={styles.creatorMenuText}>Build a reusable meal from ingredients.</Text>
                </Pressable>
                <Pressable onPress={() => openCreator("food")} style={styles.creatorMenuButton}>
                  <Text style={styles.creatorMenuTitle}>Create Food</Text>
                  <Text style={styles.creatorMenuText}>Name a food and enter its macros manually.</Text>
                </Pressable>
              </View>
                ) : null}

                {!selectedFood ? (
              <ScrollView
                style={styles.modalResults}
                contentContainerStyle={[styles.modalResultsContent, { paddingBottom: Math.max(insets.bottom + 96, 132) }]}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
                onScrollBeginDrag={Keyboard.dismiss}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.searchStatusCard}>
                  <Text style={styles.searchStatusProvider}>{providerLabel}</Text>
                  <Text style={styles.searchStatusText}>{setupMessage}</Text>
                  {searchError ? <Text style={styles.searchStatusError}>{searchError}</Text> : null}
                </View>

                {searchLoading || detailLoading ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyCardText}>{detailLoading ? "Loading nutrition details..." : "Searching foods..."}</Text>
                  </View>
                ) : null}

                {visibleFoods.length ? (
                  visibleFoods.map((food, index) => (
                    <Pressable key={`${food.source || "sample"}-${food.id}-${food.name}-${index}`} onPress={() => handlePickFood(food)} style={styles.foodResultCard}>
                      <View style={styles.foodResultCopy}>
                        <Text style={styles.foodResultName}>{food.name}</Text>
                        <Text style={styles.foodResultMeta}>
                          {[food.brand || (food.source === "fatsecret" ? "FS Food Data" : "Sample food"), food.servingLabel].filter(Boolean).join(" - ")}
                        </Text>
                        {hasAnyMicros(food.micros) ? (
                          <Text style={styles.foodResultMicroHint}>Micros available</Text>
                        ) : null}
                      </View>
                      <Text style={styles.foodResultCalories}>
                        {food.macros?.calories != null ? `${formatValue(food.macros.calories)} kcal` : "Select"}
                      </Text>
                      {activeTab === "my-meals" && food.source === "custom-meal" ? (
                        <Pressable
                          disabled={deletingMealId === food.id}
                          onPress={(event) => {
                            event?.stopPropagation?.();
                            confirmDeleteCustomMeal(food);
                          }}
                          style={({ pressed }) => [
                            styles.removeIconButton,
                            deletingMealId === food.id && { opacity: 0.5 },
                            pressed && styles.removeIconButtonPressed,
                          ]}
                        >
                          {({ pressed }) => (
                            <Image
                              source={trashActionIcon}
                              resizeMode="contain"
                              style={[styles.removeIconImage, { tintColor: pressed ? "#ff6b6b" : theme.textMuted }]}
                            />
                          )}
                        </Pressable>
                      ) : null}
                    </Pressable>
                  ))
                ) : (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyCardText}>
                      {searchTerm.trim() ? "No foods match this search yet." : "Start typing to search for a food."}
                    </Text>
                  </View>
                )}
              </ScrollView>
                ) : (
              <ScrollView
                style={styles.modalResults}
                contentContainerStyle={[styles.modalResultsContent, { paddingBottom: Math.max(insets.bottom + 96, 132) }]}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
                onScrollBeginDrag={Keyboard.dismiss}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.selectedFoodCard}>
                  <View style={styles.selectedFoodHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectedFoodName}>{selectedFood.name}</Text>
                      <Text style={styles.selectedFoodBrand}>{selectedFood.brand || "Sample food"}</Text>
                    </View>
                    {canDeleteFromGroup ? (
                      <Pressable
                        onPress={handleDeleteSelectedFood}
                        style={({ pressed }) => [
                          styles.deleteGroupButton,
                          deleteActionArmed && styles.deleteGroupButtonActive,
                          pressed && styles.deleteGroupButtonPressed,
                        ]}
                      >
                        {({ pressed }) => (
                          <Image
                            source={trashActionIcon}
                            resizeMode="contain"
                            style={[
                              styles.deleteGroupButtonIcon,
                              { tintColor: deleteActionArmed || pressed ? "#ff6b6b" : "#96a7a0" },
                            ]}
                          />
                        )}
                      </Pressable>
                    ) : null}
                    <Pressable
                      onPress={() => onToggleFavorite(selectedFood)}
                      style={({ pressed }) => [
                        styles.favoriteButton,
                        isFavorite && styles.favoriteButtonActive,
                        pressed && styles.favoriteButtonPressed,
                      ]}
                    >
                      {({ pressed }) => (
                        <Image
                          source={isFavorite || pressed ? starFilledIcon : starOutlineIcon}
                          resizeMode="contain"
                          style={[
                            styles.favoriteButtonIcon,
                            { tintColor: isFavorite ? "#ffd54f" : "#f0cd58", opacity: pressed ? 0.92 : 1 },
                          ]}
                        />
                      )}
                    </Pressable>
                  </View>

                  <View style={styles.selectionRow}>
                    <View style={styles.selectionField}>
                      <Text style={styles.selectionLabel}>Serving Size</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                        {selectedFood.servings.map((serving) => (
                          <Pressable
                            key={serving.id}
                            onPress={() => setSelectedServingId(serving.id)}
                            style={[styles.servingChip, selectedServingId === serving.id && styles.servingChipActive]}
                          >
                            <Text style={[styles.servingChipText, selectedServingId === serving.id && styles.servingChipTextActive]}>
                              {serving.label}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  </View>

                  <View style={styles.selectionField}>
                    <Text style={styles.selectionLabel}>Quantity</Text>
                    <TextInput
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="decimal-pad"
                      style={styles.quantityInput}
                    />
                  </View>

                  <View style={styles.modalMacroCard}>{macroMeta.map(renderMacroBar)}</View>

                  {selectedProminentMicros.length ? (
                    <View style={styles.microPreviewCard}>
                      <View style={styles.microPreviewHeader}>
                        <Text style={styles.microPreviewTitle}>More Nutrition</Text>
                        <Text style={styles.microPreviewToggle}>Included</Text>
                      </View>
                      <View style={styles.microChipWrap}>
                        {selectedProminentMicros.map((nutrient) => (
                          <View key={nutrient.key} style={styles.microChip}>
                            <Text style={styles.microChipLabel}>{nutrient.label}</Text>
                            <Text style={styles.microChipValue}>{formatNutrientAmount(nutrient.amount, nutrient.unit)}</Text>
                          </View>
                        ))}
                      </View>
                      <View style={styles.expandedMicroList}>
                        {selectedAllMicros.map((nutrient) => (
                          <View key={nutrient.key} style={styles.expandedMicroRow}>
                            <Text style={styles.expandedMicroLabel}>{nutrient.label}</Text>
                            <Text style={styles.expandedMicroValue}>{formatNutrientAmount(nutrient.amount, nutrient.unit)}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}

                  <View style={styles.modalButtonRow}>
                    <Pressable onPress={resetDraft} style={styles.secondaryButton}>
                      <Text style={styles.secondaryButtonText}>Back</Text>
                    </Pressable>
                    <Pressable onPress={handleConfirm} style={styles.primaryButton}>
                      <Text style={styles.primaryButtonText}>Add Food</Text>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
                )}
              </>
            ) : customMealVisible ? renderCustomMealBuilder() : renderCustomFoodBuilder()}
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal animationType="fade" transparent visible={scanVisible} onRequestClose={() => setScanVisible(false)}>
        <View style={styles.scannerBackdrop}>
          <View style={styles.scannerCard}>
            <View style={styles.scannerHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>{scanTarget === "custom-meal" ? "My Meals" : meal}</Text>
                <Text style={styles.scannerTitle}>Scan Barcode</Text>
              </View>
              <Pressable onPress={() => setScanVisible(false)} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </Pressable>
            </View>

            {!cameraPermission ? (
              <View style={[styles.cameraFrame, styles.scannerPermissionFrame]}>
                <Text style={styles.scannerPermissionText}>Preparing camera...</Text>
              </View>
            ) : cameraPermission?.granted ? (
              <View style={styles.cameraFrame}>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  enableTorch={torchEnabled}
                  barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"] }}
                  onBarcodeScanned={scanBusy ? undefined : handleBarcodeScanned}
                />
                <View style={styles.scanGuide} />
                <Pressable onPress={() => setTorchEnabled((current) => !current)} style={styles.torchButton}>
                  <Image source={torchEnabled ? flashOnIcon : flashOffIcon} style={styles.torchButtonImage} resizeMode="contain" />
                </Pressable>
              </View>
            ) : (
              <View style={[styles.cameraFrame, styles.scannerPermissionFrame]}>
                <Text style={styles.scannerPermissionText}>Camera permission is required to scan packaged foods.</Text>
                <Pressable onPress={openBarcodeScanner} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Allow Camera</Text>
                </Pressable>
              </View>
            )}

            <Text style={styles.scannerHelpText}>
              Point the camera at a barcode to look it up in Open Food Facts.
            </Text>
            {scanBusy ? <Text style={styles.scannerBusyText}>Looking up product...</Text> : null}
            {scanError ? <Text style={styles.searchStatusError}>{scanError}</Text> : null}
          </View>
        </View>
      </Modal>

    </Modal>
  );
}

function App() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const todayKey = getDateKey();
  const [activeTab, setActiveTab] = useState("diary");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [searchMeal, setSearchMeal] = useState(null);
  const [nutritionTotalsVisible, setNutritionTotalsVisible] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [favorites, setFavorites] = useState([foodLibrary[1], foodLibrary[2]]);
  const [customMeals, setCustomMeals] = useState([]);
  const [customFoods, setCustomFoods] = useState([]);
  const [workoutTemplates, setWorkoutTemplates] = useState(() => ensureProgramTemplates([]));
  const [foodDiaryByDate, setFoodDiaryByDate] = useState({});
  const [trainingSplits, setTrainingSplits] = useState(() => getDefaultPremadeSplits(ensureProgramTemplates([])));
  const [activeSplitId, setActiveSplitId] = useState("split-premade-ppl");
  const [workoutLaunchView, setWorkoutLaunchView] = useState("home");
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [expandedWorkoutTemplateId, setExpandedWorkoutTemplateId] = useState(null);
  const [workoutTemplateFilter, setWorkoutTemplateFilter] = useState("all");
  const [isWorkoutsExpanded, setIsWorkoutsExpanded] = useState(false);
  const [exercisePickerVisible, setExercisePickerVisible] = useState(false);
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState("");
  const [templateMenuId, setTemplateMenuId] = useState(null);
  const [templateEditor, setTemplateEditor] = useState(null);
  const [setTypeMenu, setSetTypeMenu] = useState(null);
  const [templateExerciseSearchTerm, setTemplateExerciseSearchTerm] = useState("");
  const [templateBuilderTargetDayId, setTemplateBuilderTargetDayId] = useState(null);
  const [templateExercisePickerVisible, setTemplateExercisePickerVisible] = useState(false);
  const [templateBuilderReturnContext, setTemplateBuilderReturnContext] = useState(null);
  const [templateSavePending, setTemplateSavePending] = useState(false);
  const [historyDateKey, setHistoryDateKey] = useState(todayKey);
  const [completedWorkouts, setCompletedWorkouts] = useState([]);
  const [historyEditorWorkout, setHistoryEditorWorkout] = useState(null);
  const [historyEditorReturnScreen, setHistoryEditorReturnScreen] = useState(null);
  const [finishWorkoutVisible, setFinishWorkoutVisible] = useState(false);
  const [finishedWorkoutSummary, setFinishedWorkoutSummary] = useState(null);
  const [saveAsTemplateDraftName, setSaveAsTemplateDraftName] = useState("");
  const [finishWorkoutPromptStep, setFinishWorkoutPromptStep] = useState("prompt");
  const [workoutClockNow, setWorkoutClockNow] = useState(Date.now());
  const [timerEditorVisible, setTimerEditorVisible] = useState(false);
  const [timerDraftHours, setTimerDraftHours] = useState(0);
  const [timerDraftMinutes, setTimerDraftMinutes] = useState(0);
  const [dashboardCarouselIndex, setDashboardCarouselIndex] = useState(0);
  const [dashboardRanges, setDashboardRanges] = useState({
    calories: "30 Days",
    bodyweight: "30 Days",
    sleep: "30 Days",
  });
  const activeWorkoutScrollRef = useRef(null);
  const activeWorkoutScrollYRef = useRef(0);
  const activeWorkoutSetRowLayoutsRef = useRef({});
  const activeWorkoutScopedLoadRef = useRef("");
  const [dashboardPanel, setDashboardPanel] = useState(null);
  const [progressStatsVisible, setProgressStatsVisible] = useState(false);
  const [programVisible, setProgramVisible] = useState(false);
  const [programScreen, setProgramScreen] = useState("home");
  const [programWeekStartKey, setProgramWeekStartKey] = useState(getDateKey(getStartOfWeek(new Date())));
  const [programSelectedDateKey, setProgramSelectedDateKey] = useState(todayKey);
  const [programCalendarVisible, setProgramCalendarVisible] = useState(false);
  const [programCalendarMonthKey, setProgramCalendarMonthKey] = useState(getDateKey(getStartOfMonth(new Date())));
  const [programExercisesExpanded, setProgramExercisesExpanded] = useState(true);
  const [workoutHomeExercisesExpanded, setWorkoutHomeExercisesExpanded] = useState(false);
  const [splitEditorDraft, setSplitEditorDraft] = useState(null);
  const [splitSelectorExpanded, setSplitSelectorExpanded] = useState(false);
  const [splitManagementMenuVisible, setSplitManagementMenuVisible] = useState(false);
  const [splitCellMenu, setSplitCellMenu] = useState(null);
  const [customSplitDraft, setCustomSplitDraft] = useState(null);
  const [customSplitWorkoutPickerDayId, setCustomSplitWorkoutPickerDayId] = useState(null);
  const [customSplitActionDayId, setCustomSplitActionDayId] = useState(null);
  const [pendingCustomTemplateBuilderDayId, setPendingCustomTemplateBuilderDayId] = useState(null);
  const [programSaveState, setProgramSaveState] = useState("");
  const [exerciseInsightTarget, setExerciseInsightTarget] = useState(null);
  const [settingsScreen, setSettingsScreen] = useState(null);
  const [settingsPlaceholder, setSettingsPlaceholder] = useState(null);
  const [settingsReturnScreen, setSettingsReturnScreen] = useState(null);
  const [userProfile, setUserProfile] = useState(defaultUserProfile);
  const [profileDraft, setProfileDraft] = useState(defaultUserProfile);
  const [profileSaveState, setProfileSaveState] = useState("");
  const profileHeightParts = parseHeightParts(profileDraft.height || userProfile.height);
  const profileStorageKey = authUser?.id
    ? `${storageKeys.userProfile}:${authUser.id}`
    : storageKeys.userProfile;
  const profilePhotoStorageKey = authUser?.id
    ? `${storageKeys.userProfilePhoto}:${authUser.id}`
    : storageKeys.userProfilePhoto;
  const activeWorkoutStorageKey = authUser?.id
    ? `${storageKeys.activeWorkout}:${authUser.id}`
    : storageKeys.activeWorkout;
  const [accountDraft, setAccountDraft] = useState({ email: "", password: "" });
  const [accountActionState, setAccountActionState] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authSession, setAuthSession] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [cloudSyncState, setCloudSyncState] = useState("");
  const [cloudSyncPending, setCloudSyncPending] = useState(false);
  const [lastCloudSyncAt, setLastCloudSyncAt] = useState("");
  const [lastLocalDataChangeAt, setLastLocalDataChangeAt] = useState("");
  const [cloudRemoteUpdatedAt, setCloudRemoteUpdatedAt] = useState("");
  const [cloudStatusBusy, setCloudStatusBusy] = useState(false);
  const [checkIns, setCheckIns] = useState([]);
  const [checkInVisible, setCheckInVisible] = useState(false);
  const [checkInDraft, setCheckInDraft] = useState({ dateKey: todayKey, weightLbs: "", photos: [] });
  const [checkInSaveState, setCheckInSaveState] = useState("");
  const [storageHydrated, setStorageHydrated] = useState(false);
  const [diaryEntryEditor, setDiaryEntryEditor] = useState(null);
  const [showWorkoutOverflowRows, setShowWorkoutOverflowRows] = useState(false);
  const [savedWorkoutOverflowHeight, setSavedWorkoutOverflowHeight] = useState(0);
  const dashboardScrollX = useRef(new Animated.Value(0)).current;
  const bottomNavTranslateX = useRef(new Animated.Value(0)).current;
  const deferredTabSwitchRef = useRef(null);
  const savedWorkoutOverflowAnim = useRef(new Animated.Value(0)).current;
  const [bottomNavWidth, setBottomNavWidth] = useState(0);
  const exerciseInsightSheetTranslateY = useRef(new Animated.Value(360)).current;
  const workoutTimerPulse = useRef(new Animated.Value(1)).current;
  const pendingTemplateBuilderInteractionRef = useRef(null);
  const demoProfileMetricsSeededRef = useRef(false);
  const profileScopedLoadRef = useRef("");
  const cloudRestoreAttemptedRef = useRef(false);
  const cloudRestoreInProgressRef = useRef(false);
  const cloudSyncInFlightRef = useRef(false);
  const cloudAutoSyncTimeoutRef = useRef(null);
  const lastCloudSyncSnapshotRef = useRef("");
  const currentCloudSyncSnapshotRef = useRef("");
  const localChangeTrackingReadyRef = useRef(false);
  const lastLocalSnapshotRef = useRef("");
  const cloudAutoDecisionKeyRef = useRef("");

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const selectedDiary = useMemo(() => foodDiaryByDate[selectedDateKey] || emptyDiary(), [foodDiaryByDate, selectedDateKey]);
  const diaryEntries = useMemo(() => mealOrder.flatMap((meal) => selectedDiary[meal]), [selectedDiary]);
  const allDiaryEntries = useMemo(
    () => Object.values(foodDiaryByDate).flatMap((diary) => mealOrder.flatMap((meal) => diary[meal] || [])),
    [foodDiaryByDate]
  );
  const totals = useMemo(() => sumMacros(diaryEntries), [diaryEntries]);
  const diaryEditorNutrition = useMemo(() => {
    if (!diaryEntryEditor?.food) {
      return null;
    }
    const serving = diaryEntryEditor.food.servings.find((item) => item.id === diaryEntryEditor.servingId) || diaryEntryEditor.food.servings[0];
    const quantity = Math.max(Number.parseFloat(diaryEntryEditor.amount) || 1, 0.25);
    const servingNutrition = getServingNutrition(diaryEntryEditor.food, serving);
    return {
      calories: Number((servingNutrition.calories * quantity).toFixed(1)),
      protein: Number((servingNutrition.protein * quantity).toFixed(1)),
      carbs: Number((servingNutrition.carbs * quantity).toFixed(1)),
      fat: Number((servingNutrition.fat * quantity).toFixed(1)),
      micros: scaleMicros(servingNutrition.micros, quantity),
    };
  }, [diaryEntryEditor]);
  const diaryEditorIsFavorite = useMemo(
    () => (diaryEntryEditor?.food ? [...customFoods, ...favorites].some((food) => food.id === diaryEntryEditor.food.id) : false),
    [customFoods, diaryEntryEditor?.food, favorites]
  );
  const relativeDayLabel = getRelativeDayLabel(selectedDateKey);
  const fullDateLabel = formatDateCaption(selectedDateKey);
  const exerciseResults = useMemo(() => searchExercises(exerciseSearchTerm), [exerciseSearchTerm]);
  const templateExerciseResults = useMemo(() => searchExercises(templateExerciseSearchTerm), [templateExerciseSearchTerm]);
  const activeWorkoutTemplate = useMemo(
    () => workoutTemplates.find((template) => template.id === activeWorkout?.templateId) || null,
    [activeWorkout?.templateId, workoutTemplates]
  );
  const exerciseInsight = useMemo(
    () => (exerciseInsightTarget ? buildExerciseInsight(exerciseInsightTarget, completedWorkouts) : null),
    [completedWorkouts, exerciseInsightTarget]
  );
  const activeSplit = useMemo(() => getActiveSplit(trainingSplits, activeSplitId), [trainingSplits, activeSplitId]);
  const activeWorkoutTemplateChanged = useMemo(
    () => hasWorkoutTemplateChanges(activeWorkoutTemplate, activeWorkout),
    [activeWorkout, activeWorkoutTemplate]
  );
  const activeWorkoutElapsedSeconds = useMemo(
    () => getActiveWorkoutElapsedSeconds(activeWorkout, new Date(workoutClockNow).toISOString()),
    [activeWorkout, workoutClockNow]
  );
  const historyDayLabel = getRelativeDayLabel(historyDateKey);
  const historyFullDateLabel = formatDateCaption(historyDateKey);
  const workoutsForHistoryDay = useMemo(
    () => completedWorkouts.filter((workout) => workout.dateKey === historyDateKey),
    [completedWorkouts, historyDateKey]
  );
  const selectedProgramHistoryWorkouts = useMemo(
    () => completedWorkouts.filter((workout) => workout.dateKey === programSelectedDateKey),
    [completedWorkouts, programSelectedDateKey]
  );
  const weightUnitPreference = String(userProfile?.weightUnit || "lbs").toLowerCase() === "kg" ? "kg" : "lbs";
  const dashboardMetrics = useMemo(
    () => buildDashboardMetrics({ foodDiaryByDate, endDateKey: todayKey, rangeByMetric: dashboardRanges, checkIns }).map((metric) => {
      if (metric.id !== "bodyweight" || weightUnitPreference !== "kg") {
        return metric;
      }
      const convertToKg = (value) => Number((toNumber(value) * 0.45359237).toFixed(1));
      const kgTrend = convertToKg(metric.trend);
      return {
        ...metric,
        unit: "kg",
        value: convertToKg(metric.value),
        trend: `${kgTrend >= 0 ? "+" : ""}${formatCompactNumber(kgTrend, 1)}`,
        data: metric.data.map((point) => ({
          ...point,
          value: convertToKg(point.value),
          displayValue: convertToKg(point.displayValue ?? point.value),
        })),
      };
    }),
    [checkIns, dashboardRanges, foodDiaryByDate, todayKey, weightUnitPreference]
  );
  const visibleDashboardMetrics = useMemo(
    () => dashboardMetrics,
    [dashboardMetrics]
  );
  const progressStats = useMemo(() => {
    const last7Keys = getDateKeysForRange(todayKey, 7);
    const last14Keys = getDateKeysForRange(todayKey, 14);
    const last7Diary = last7Keys.map((dateKey) => foodDiaryByDate[dateKey]).filter(Boolean);
    const nutritionTotals = last7Diary.reduce((sum, diary) => {
      const totals = sumMacros(mealOrder.flatMap((meal) => diary?.[meal] || []));
      return {
        calories: sum.calories + totals.calories,
        protein: sum.protein + totals.protein,
        carbs: sum.carbs + totals.carbs,
        fat: sum.fat + totals.fat,
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    const nutritionDays = Math.max(last7Diary.length, 1);
    const recentCheckIns = [...(checkIns || [])]
      .filter((entry) => last14Keys.includes(entry.dateKey))
      .sort((left, right) => String(left.dateKey).localeCompare(String(right.dateKey)));
    const sleepValues = recentCheckIns.map((entry) => toNumber(entry.sleepHours)).filter(Boolean);
    const weightValues = recentCheckIns.map((entry) => toNumber(entry.weightLbs)).filter(Boolean);
    const recentWorkouts = (completedWorkouts || []).filter((workout) => last14Keys.includes(workout.dateKey));
    const workoutVolume = recentWorkouts.reduce((sum, workout) => sum + (workout.exercises || []).reduce((exerciseSum, exercise) => (
      exerciseSum + (exercise.sets || []).reduce((setSum, set) => setSum + (toNumber(set.weight) * toNumber(set.reps)), 0)
    ), 0), 0);
    const durations = recentWorkouts.map((workout) => toNumber(workout.summary?.durationSeconds)).filter(Boolean);
    const weightChange = weightValues.length > 1 ? weightValues[weightValues.length - 1] - weightValues[0] : 0;

    return {
      avgCalories: Math.round(nutritionTotals.calories / nutritionDays),
      avgProtein: Math.round(nutritionTotals.protein / nutritionDays),
      avgCarbs: Math.round(nutritionTotals.carbs / nutritionDays),
      avgFat: Math.round(nutritionTotals.fat / nutritionDays),
      avgSleep: sleepValues.length ? Number((sleepValues.reduce((sum, value) => sum + value, 0) / sleepValues.length).toFixed(1)) : 0,
      bestSleep: sleepValues.length ? Math.max(...sleepValues) : 0,
      worstSleep: sleepValues.length ? Math.min(...sleepValues) : 0,
      latestWeight: weightValues.length ? weightValues[weightValues.length - 1] : toNumber(userProfile.weightLbs),
      weightChange,
      recentCheckIns: recentCheckIns.slice(-5).reverse(),
      workoutsPerWeek: Number((recentWorkouts.length / 2).toFixed(1)),
      completedWorkouts: recentWorkouts.length,
      avgWorkoutMinutes: durations.length ? Math.round((durations.reduce((sum, value) => sum + value, 0) / durations.length) / 60) : 0,
      avgWorkoutVolume: recentWorkouts.length ? Math.round(workoutVolume / recentWorkouts.length) : 0,
      recentPrs: recentWorkouts.slice(0, 2).map((workout) => ({
        id: workout.id,
        label: workout.name,
        detail: `${workout.exercises?.length || 0} exercises`,
      })),
    };
  }, [checkIns, completedWorkouts, foodDiaryByDate, todayKey, userProfile.weightLbs]);
  const dashboardCardWidth = Math.min(windowWidth - 32, 430);
  const screenContentStyle = useMemo(
    () => [styles.screenContent, { paddingTop: Math.max(insets.top + 8, 20) }],
    [insets.top]
  );
  const programWeekDates = useMemo(() => getWeekDates(parseDateKey(programWeekStartKey)), [programWeekStartKey]);
  const programCalendarMonthDate = useMemo(() => getStartOfMonth(parseDateKey(programCalendarMonthKey)), [programCalendarMonthKey]);
  const programCalendarDates = useMemo(() => getMonthCalendarDates(programCalendarMonthDate), [programCalendarMonthDate]);
  const dailyNutritionSections = useMemo(() => {
    const macroRows = [
      { key: "calories", label: "Calories", amount: totals.calories, unit: "kcal", target: goals.calories, color: macroMeta[0].color },
      { key: "protein", label: "Protein", amount: totals.protein, unit: "g", target: goals.protein, color: macroMeta[1].color },
      { key: "carbs", label: "Carbs", amount: totals.carbs, unit: "g", target: goals.carbs, color: macroMeta[2].color },
      { key: "fat", label: "Fat", amount: totals.fat, unit: "g", target: goals.fat, color: macroMeta[3].color },
    ];

    const categorizedMicros = micronutrientMeta.reduce((accumulator, nutrient) => {
      const entry = totals.micros?.[nutrient.key];
      if (!entry || toNumber(entry.amount) <= 0) {
        return accumulator;
      }

      const bucket = accumulator[nutrient.category] || [];
      bucket.push({
        key: nutrient.key,
        label: nutrient.label,
        amount: entry.amount,
        unit: entry.unit || nutrient.unit,
        target: nutrient.target,
        color: "#2dd4a2",
      });
      accumulator[nutrient.category] = bucket;
      return accumulator;
    }, {});

    return [
      { title: "Energy & Macros", rows: macroRows },
      { title: "Vitamins", rows: categorizedMicros["Vitamins"] || [] },
      { title: "Minerals", rows: categorizedMicros["Minerals"] || [] },
      { title: "Other Nutrition", rows: categorizedMicros["Other Nutrition"] || [] },
    ];
  }, [totals]);
  const programWeekStats = useMemo(
    () => getWeeklyCompletionStats(programWeekDates, activeSplit, completedWorkouts),
    [activeSplit, completedWorkouts, programWeekDates]
  );
  const selectedProgramSchedule = useMemo(
    () => getTodayScheduledWorkout(activeSplit, programSelectedDateKey, workoutTemplates),
    [activeSplit, programSelectedDateKey, workoutTemplates]
  );
  const todaysProgramSchedule = useMemo(
    () => getTodayScheduledWorkout(activeSplit, todayKey, workoutTemplates),
    [activeSplit, todayKey, workoutTemplates]
  );
  const todaysWorkoutMuscleGroups = useMemo(
    () => getTemplateMuscleGroups(todaysProgramSchedule?.template),
    [todaysProgramSchedule]
  );
  const todayDiaryEntries = useMemo(
    () => mealOrder.flatMap((meal) => foodDiaryByDate[todayKey]?.[meal] || []),
    [foodDiaryByDate, todayKey]
  );
  const todayDiaryTotals = useMemo(
    () => sumMacros(mealOrder.flatMap((meal) => foodDiaryByDate[todayKey]?.[meal] || [])),
    [foodDiaryByDate, todayKey]
  );
  const nextProgramSchedule = useMemo(() => {
    if (!activeSplit?.scheduledDays?.length) {
      return null;
    }
    for (let offset = 1; offset <= Math.max(activeSplit.scheduledDays.length, 7); offset += 1) {
      const nextDateKey = shiftDateKey(todayKey, offset);
      const nextSchedule = getTodayScheduledWorkout(activeSplit, nextDateKey, workoutTemplates);
      if (nextSchedule?.scheduledDay && !nextSchedule.scheduledDay.isRestDay) {
        return {
          ...nextSchedule,
          dateKey: nextDateKey,
        };
      }
    }
    return null;
  }, [activeSplit, todayKey, workoutTemplates]);
  const latestCompletedWorkout = completedWorkouts[0] || null;
  const latestCheckInEntry = checkIns[0] || null;
  const filteredWorkoutTemplates = useMemo(() => {
    const personalSorted = [...workoutTemplates].filter((template) => !template.isPlaceholder).sort((left, right) =>
      String(right.createdAt || "").localeCompare(String(left.createdAt || ""))
    );
    const presetSorted = [...workoutTemplates].filter((template) => template.isPlaceholder);
    if (workoutTemplateFilter === "preset") {
      return presetSorted;
    }
    if (workoutTemplateFilter === "custom") {
      return personalSorted;
    }
    if (workoutTemplateFilter === "recent") {
      return personalSorted.slice(0, 8);
    }
    return personalSorted;
  }, [workoutTemplateFilter, workoutTemplates]);
  const SAVED_WORKOUT_PREVIEW_LIMIT = 3;
  const previewWorkoutTemplates = useMemo(
    () => filteredWorkoutTemplates.slice(0, SAVED_WORKOUT_PREVIEW_LIMIT),
    [filteredWorkoutTemplates]
  );
  const overflowWorkoutTemplates = useMemo(
    () => filteredWorkoutTemplates.slice(SAVED_WORKOUT_PREVIEW_LIMIT),
    [filteredWorkoutTemplates]
  );
  const activeTabIndex = Math.max(0, tabs.findIndex((tab) => tab.key === activeTab));
  const cloudSyncSnapshot = useMemo(
    () =>
      JSON.stringify({
        profile: userProfile,
        diary: serializeFoodDiaryByDate(foodDiaryByDate),
        checkIns,
        workoutTemplates,
        trainingSplits,
        activeSplitId,
        completedWorkouts,
      }),
    [activeSplitId, checkIns, completedWorkouts, foodDiaryByDate, trainingSplits, userProfile, workoutTemplates]
  );
  const cloudSyncSummary = useMemo(() => {
    if (!authUser?.id) {
      return "Sign in to turn on cloud backup for this device.";
    }
    if (cloudStatusBusy) {
      return "Checking cloud backup status...";
    }
    if (authBusy && cloudSyncInFlightRef.current) {
      return "Syncing your latest changes...";
    }
    if (cloudSyncPending) {
      return "Local changes are queued and will sync automatically.";
    }
    const cloudIsNewer =
      cloudRemoteUpdatedAt &&
      (!lastCloudSyncAt || new Date(cloudRemoteUpdatedAt).getTime() > new Date(lastCloudSyncAt).getTime());
    const localChangedAfterSync =
      lastLocalDataChangeAt &&
      (!lastCloudSyncAt || new Date(lastLocalDataChangeAt).getTime() > new Date(lastCloudSyncAt).getTime());

    if (cloudIsNewer && localChangedAfterSync) {
      return "Cloud backup and this device both changed since the last sync. Review before replacing either side.";
    }
    if (cloudIsNewer) {
      return "A newer cloud backup is available. Load Cloud Data to update this device.";
    }
    if (lastCloudSyncAt) {
      return `Last synced ${formatRelativeTimestamp(lastCloudSyncAt)}.`;
    }
    return "Auto cloud backup is on. Use Sync Local Data any time to force a backup.";
  }, [authBusy, authUser?.id, cloudRemoteUpdatedAt, cloudStatusBusy, cloudSyncPending, lastCloudSyncAt, lastLocalDataChangeAt]);
  const cloudSyncConflict = useMemo(() => {
    const cloudIsNewer =
      cloudRemoteUpdatedAt &&
      (!lastCloudSyncAt || new Date(cloudRemoteUpdatedAt).getTime() > new Date(lastCloudSyncAt).getTime());
    const localChangedAfterSync =
      lastLocalDataChangeAt &&
      (!lastCloudSyncAt || new Date(lastLocalDataChangeAt).getTime() > new Date(lastCloudSyncAt).getTime());

    return {
      cloudIsNewer,
      localChangedAfterSync,
      hasConflict: Boolean(cloudIsNewer && localChangedAfterSync),
    };
  }, [cloudRemoteUpdatedAt, lastCloudSyncAt, lastLocalDataChangeAt]);

  useEffect(() => {
    currentCloudSyncSnapshotRef.current = cloudSyncSnapshot;
  }, [cloudSyncSnapshot]);

  useEffect(() => () => {
    if (deferredTabSwitchRef.current) {
      clearTimeout(deferredTabSwitchRef.current);
    }
  }, []);

  useEffect(() => {
    if (overflowWorkoutTemplates.length === 0) {
      savedWorkoutOverflowAnim.stopAnimation();
      savedWorkoutOverflowAnim.setValue(0);
      setShowWorkoutOverflowRows(false);
      if (isWorkoutsExpanded) {
        setIsWorkoutsExpanded(false);
      }
    }
  }, [isWorkoutsExpanded, overflowWorkoutTemplates.length, savedWorkoutOverflowAnim]);

  useEffect(() => {
    if (!isWorkoutsExpanded) {
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsWorkoutsExpanded(false);
  }, [workoutTemplateFilter]);

  useEffect(() => {
    if (!storageHydrated) {
      return;
    }

    if (cloudRestoreInProgressRef.current) {
      lastLocalSnapshotRef.current = cloudSyncSnapshot;
      return;
    }

    if (!localChangeTrackingReadyRef.current) {
      localChangeTrackingReadyRef.current = true;
      lastLocalSnapshotRef.current = cloudSyncSnapshot;
      return;
    }

    if (cloudSyncSnapshot === lastLocalSnapshotRef.current) {
      return;
    }

    lastLocalSnapshotRef.current = cloudSyncSnapshot;
    setLastLocalDataChangeAt(new Date().toISOString());
  }, [cloudSyncSnapshot, storageHydrated]);

  useEffect(() => {
    if (!activeWorkout?.startedAt) {
      return undefined;
    }

    setWorkoutClockNow(Date.now());
    const intervalId = setInterval(() => {
      setWorkoutClockNow(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [activeWorkout?.startedAt]);

  const animateQuickRemoval = () => {
    LayoutAnimation.configureNext({
      duration: 200,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
  };

  const animateQuickInsert = () => {
    LayoutAnimation.configureNext({
      duration: 180,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
  };

  const toggleSavedWorkoutsExpanded = () => {
    if (!overflowWorkoutTemplates.length) {
      return;
    }

    if (isWorkoutsExpanded) {
      Animated.timing(savedWorkoutOverflowAnim, {
        toValue: 0,
        duration: 190,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          setShowWorkoutOverflowRows(false);
          setIsWorkoutsExpanded(false);
        }
      });
      return;
    }

    setShowWorkoutOverflowRows(true);
    setIsWorkoutsExpanded(true);
    requestAnimationFrame(() => {
      Animated.timing(savedWorkoutOverflowAnim, {
        toValue: 1,
        duration: 210,
        useNativeDriver: false,
      }).start();
    });
  };

  const triggerWorkoutTimerPulse = () => {
    workoutTimerPulse.stopAnimation();
    workoutTimerPulse.setValue(1);
    Animated.sequence([
      Animated.timing(workoutTimerPulse, {
        toValue: 0.52,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(workoutTimerPulse, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(workoutTimerPulse, {
        toValue: 0.52,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(workoutTimerPulse, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    if (!bottomNavWidth) {
      return;
    }
    animateBottomNavToIndex(activeTabIndex, 95);
  }, [activeTabIndex, bottomNavWidth]);

  useEffect(() => {
    let isMounted = true;

    const hydrateLocalState = async () => {
      try {
        const [
          savedProfile,
          savedProfilePhoto,
          savedDiary,
          savedCheckIns,
          savedWorkoutTemplates,
          savedTrainingSplits,
          savedActiveSplitId,
          savedActiveWorkout,
          savedCompletedWorkouts,
          savedFavoriteFoods,
          savedCustomFoods,
          savedCustomMeals,
          savedAuthSession,
          savedCloudSyncMeta,
        ] = await Promise.all([
          AsyncStorage.getItem(storageKeys.userProfile),
          AsyncStorage.getItem(storageKeys.userProfilePhoto),
          AsyncStorage.getItem(storageKeys.foodDiaryByDate),
          AsyncStorage.getItem(storageKeys.checkIns),
          AsyncStorage.getItem(storageKeys.workoutTemplates),
          AsyncStorage.getItem(storageKeys.trainingSplits),
          AsyncStorage.getItem(storageKeys.activeSplitId),
          AsyncStorage.getItem(storageKeys.activeWorkout),
          AsyncStorage.getItem(storageKeys.completedWorkouts),
          AsyncStorage.getItem(storageKeys.favoriteFoods),
          AsyncStorage.getItem(storageKeys.customFoods),
          AsyncStorage.getItem(storageKeys.customMeals),
          AsyncStorage.getItem(storageKeys.authSession),
          AsyncStorage.getItem(storageKeys.cloudSyncMeta),
        ]);

        if (!isMounted) {
          return;
        }

        if (savedProfile) {
          const parsedProfile = JSON.parse(savedProfile);
          const resolvedProfilePhotoUri = resolvePersistedImageUri({
            folderName: "profile-photos",
            filePrefix: "profile-photo",
            scopeId: authUser?.id || authUser?.email || "signed-out",
            fallbackUri: savedProfilePhoto || parsedProfile?.profilePhotoUri || "",
          });
          const normalizedProfile = {
            firstName: String(parsedProfile?.firstName || ""),
            height: String(parsedProfile?.height || ""),
            weightLbs: String(parsedProfile?.weightLbs || ""),
            sex: String(parsedProfile?.sex || ""),
            profilePhotoUri: String(resolvedProfilePhotoUri || ""),
          };
          setUserProfile(normalizedProfile);
          setProfileDraft(normalizedProfile);
        }

        if (savedDiary) {
          setFoodDiaryByDate(serializeFoodDiaryByDate(JSON.parse(savedDiary)));
        }

        if (savedCheckIns) {
          const normalizedCheckIns = JSON.parse(savedCheckIns).map(normalizeCheckInEntry);
          setCheckIns(normalizedCheckIns);
        }

        if (savedCompletedWorkouts) {
          const normalizedCompletedWorkouts = JSON.parse(savedCompletedWorkouts).map(normalizeCompletedWorkoutRecord);
          setCompletedWorkouts(normalizedCompletedWorkouts.filter((workout) => !isPlaceholderCompletedWorkout(workout)));
        }

        if (savedFavoriteFoods) {
          const parsedFavorites = JSON.parse(savedFavoriteFoods);
          if (Array.isArray(parsedFavorites)) {
            setFavorites(parsedFavorites);
          }
        }

        if (savedCustomFoods) {
          const parsedCustomFoods = JSON.parse(savedCustomFoods);
          if (Array.isArray(parsedCustomFoods)) {
            setCustomFoods(parsedCustomFoods);
          }
        }

        if (savedCustomMeals) {
          const parsedCustomMeals = JSON.parse(savedCustomMeals);
          if (Array.isArray(parsedCustomMeals)) {
            setCustomMeals(parsedCustomMeals);
          }
        }

        if (savedActiveWorkout) {
          setActiveWorkout(JSON.parse(savedActiveWorkout));
        }

        const mergedTemplates = ensureProgramTemplates(
          savedWorkoutTemplates ? JSON.parse(savedWorkoutTemplates) : []
        );
        setWorkoutTemplates(mergedTemplates);

        const hydratedSplits = seedPremadeSplitsIfNeeded(
          savedTrainingSplits ? JSON.parse(savedTrainingSplits) : [],
          mergedTemplates
        );
        setTrainingSplits(hydratedSplits);

        if (savedActiveSplitId) {
          setActiveSplitId(String(savedActiveSplitId));
        } else if (hydratedSplits[0]?.id) {
          setActiveSplitId(hydratedSplits[0].id);
        }

        if (savedAuthSession) {
          const parsedSession = JSON.parse(savedAuthSession);
          if (parsedSession?.accessToken) {
            setAuthSession(parsedSession);
          }
        }

        if (savedCloudSyncMeta) {
          const parsedMeta = JSON.parse(savedCloudSyncMeta);
          if (parsedMeta?.lastCloudSyncAt) {
            setLastCloudSyncAt(String(parsedMeta.lastCloudSyncAt));
          }
          if (parsedMeta?.lastLocalDataChangeAt) {
            setLastLocalDataChangeAt(String(parsedMeta.lastLocalDataChangeAt));
          }
          if (parsedMeta?.cloudRemoteUpdatedAt) {
            setCloudRemoteUpdatedAt(String(parsedMeta.cloudRemoteUpdatedAt));
          }
        }
      } catch (error) {
        logAppError({
          source: "storage",
          action: "hydrate-local-state",
          userMessage: "Local app data could not be restored.",
          error,
        });
      } finally {
        if (isMounted) {
          setStorageHydrated(true);
        }
      }
    };

    hydrateLocalState();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!storageHydrated) {
      return;
    }
    if (authUser?.id && profileScopedLoadRef.current !== authUser.id) {
      return;
    }
    Promise.all([
      AsyncStorage.setItem(profileStorageKey, JSON.stringify(sanitizeProfileForStorage(userProfile))),
      AsyncStorage.setItem(profilePhotoStorageKey, String(userProfile.profilePhotoUri || "")),
    ]).catch((error) => {
      console.log("[SETTINGS PROFILE PERSIST]", { key: profileStorageKey, photoKey: profilePhotoStorageKey, message: error?.message || error });
    });
  }, [authUser?.id, profilePhotoStorageKey, profileStorageKey, storageHydrated, userProfile]);

  useEffect(() => {
    if (!storageHydrated) {
      return;
    }
    AsyncStorage.setItem(storageKeys.foodDiaryByDate, JSON.stringify(serializeFoodDiaryByDate(foodDiaryByDate))).catch((error) => {
      console.log("[FOOD DIARY PERSIST]", error?.message || error);
    });
  }, [foodDiaryByDate, storageHydrated]);

  useEffect(() => {
    if (!storageHydrated) {
      return;
    }
    AsyncStorage.setItem(storageKeys.checkIns, JSON.stringify(checkIns)).catch((error) => {
      console.log("[CHECK IN PERSIST]", error?.message || error);
    });
  }, [checkIns, storageHydrated]);

  useEffect(() => {
    if (!storageHydrated) {
      return;
    }
    AsyncStorage.setItem(storageKeys.completedWorkouts, JSON.stringify(completedWorkouts)).catch((error) => {
      console.log("[COMPLETED WORKOUTS PERSIST]", error?.message || error);
    });
  }, [completedWorkouts, storageHydrated]);

  useEffect(() => {
    if (!storageHydrated) {
      return;
    }
    AsyncStorage.setItem(storageKeys.favoriteFoods, JSON.stringify(favorites)).catch((error) => {
      logAppError({
        source: "storage",
        action: "persist-favorite-foods",
        userMessage: "Favorite foods could not be saved.",
        error,
      });
    });
  }, [favorites, storageHydrated]);

  useEffect(() => {
    if (!storageHydrated) {
      return;
    }
    AsyncStorage.setItem(storageKeys.customFoods, JSON.stringify(customFoods)).catch((error) => {
      logAppError({
        source: "storage",
        action: "persist-custom-foods",
        userMessage: "Created foods could not be saved.",
        error,
      });
    });
  }, [customFoods, storageHydrated]);

  useEffect(() => {
    if (!storageHydrated) {
      return;
    }
    AsyncStorage.setItem(storageKeys.customMeals, JSON.stringify(customMeals)).catch((error) => {
      logAppError({
        source: "storage",
        action: "persist-custom-meals",
        userMessage: "Created meals could not be saved.",
        error,
      });
    });
  }, [customMeals, storageHydrated]);

  useEffect(() => {
    if (!storageHydrated) {
      return;
    }
    AsyncStorage.setItem(storageKeys.workoutTemplates, JSON.stringify(workoutTemplates)).catch((error) => {
      console.log("[WORKOUT TEMPLATE PERSIST]", error?.message || error);
    });
  }, [storageHydrated, workoutTemplates]);

  useEffect(() => {
    if (!storageHydrated) {
      return;
    }
    AsyncStorage.setItem(storageKeys.trainingSplits, JSON.stringify(trainingSplits)).catch((error) => {
      console.log("[TRAINING SPLIT PERSIST]", error?.message || error);
    });
  }, [storageHydrated, trainingSplits]);

  useEffect(() => {
    if (!storageHydrated) {
      return;
    }
    AsyncStorage.setItem(storageKeys.activeSplitId, activeSplitId).catch((error) => {
      logAppError({
        source: "program",
        action: "persist-active-split",
        userMessage: "The active split could not be saved.",
        error,
      });
    });
  }, [activeSplitId, storageHydrated]);

  useEffect(() => {
    if (!storageHydrated) {
      return;
    }
    if (authUser?.id && activeWorkoutScopedLoadRef.current !== authUser.id) {
      return;
    }
    AsyncStorage.setItem(activeWorkoutStorageKey, JSON.stringify(activeWorkout)).catch((error) => {
      logAppError({
        source: "workout",
        action: "persist-active-workout",
        userMessage: "Your active workout could not be saved locally.",
        error,
        details: {
          key: activeWorkoutStorageKey,
          hasWorkout: Boolean(activeWorkout),
          workoutId: activeWorkout?.id || null,
        },
      });
    });
  }, [activeWorkout, activeWorkoutStorageKey, authUser?.id, storageHydrated]);

  useEffect(() => {
    if (!storageHydrated) {
      return;
    }
    if (!authUser?.id) {
      profileScopedLoadRef.current = "";
      return;
    }

    let isMounted = true;
    Promise.all([
      AsyncStorage.getItem(profileStorageKey),
      AsyncStorage.getItem(profilePhotoStorageKey),
    ])
      .then(([savedProfile, savedPhotoUri]) => {
        if (!isMounted) {
          return;
        }
        profileScopedLoadRef.current = authUser.id;
        if (!savedProfile) {
          const resolvedScopedPhotoUri = resolvePersistedImageUri({
            folderName: "profile-photos",
            filePrefix: "profile-photo",
            scopeId: authUser?.id || authUser?.email || "signed-out",
            fallbackUri: savedPhotoUri || "",
          });
          if (resolvedScopedPhotoUri) {
            setUserProfile((current) => ({ ...current, profilePhotoUri: resolvedScopedPhotoUri }));
            setProfileDraft((current) => ({ ...current, profilePhotoUri: resolvedScopedPhotoUri }));
          }
          return;
        }
        const parsedProfile = JSON.parse(savedProfile);
        const resolvedScopedPhotoUri = resolvePersistedImageUri({
          folderName: "profile-photos",
          filePrefix: "profile-photo",
          scopeId: authUser?.id || authUser?.email || "signed-out",
          fallbackUri: savedPhotoUri || parsedProfile?.profilePhotoUri || "",
        });
        const normalizedProfile = {
          firstName: String(parsedProfile?.firstName || ""),
          height: String(parsedProfile?.height || ""),
          weightLbs: String(parsedProfile?.weightLbs || ""),
          sex: String(parsedProfile?.sex || ""),
          profilePhotoUri: String(resolvedScopedPhotoUri || ""),
        };
        setUserProfile(normalizedProfile);
        setProfileDraft(normalizedProfile);
      })
      .catch((error) => {
        logAppError({
          source: "profile",
          action: "hydrate-scoped-profile",
          userMessage: "Your profile could not be restored for this account.",
          error,
          details: { key: profileStorageKey, photoKey: profilePhotoStorageKey },
        });
      });

    return () => {
      isMounted = false;
    };
  }, [authUser?.id, profilePhotoStorageKey, profileStorageKey, storageHydrated]);

  useEffect(() => {
    if (!storageHydrated) {
      return;
    }
    if (!authUser?.id) {
      activeWorkoutScopedLoadRef.current = "";
      return;
    }

    let isMounted = true;
    AsyncStorage.getItem(activeWorkoutStorageKey)
      .then((savedActiveWorkout) => {
        if (!isMounted) {
          return;
        }
        activeWorkoutScopedLoadRef.current = authUser.id;
        if (savedActiveWorkout) {
          setActiveWorkout(JSON.parse(savedActiveWorkout));
          logAppInfo({
            source: "workout",
            action: "restore-active-workout",
            userMessage: "Restored active workout.",
            details: { key: activeWorkoutStorageKey, userId: authUser.id },
          });
        } else {
          setActiveWorkout(null);
        }
      })
      .catch((error) => {
        logAppError({
          source: "workout",
          action: "hydrate-scoped-active-workout",
          userMessage: "An active workout could not be restored.",
          error,
          details: { key: activeWorkoutStorageKey, userId: authUser.id },
        });
      });

    return () => {
      isMounted = false;
    };
  }, [activeWorkoutStorageKey, authUser?.id, storageHydrated]);

  useEffect(() => {
    if (!storageHydrated) {
      return;
    }

    if (!authSession?.accessToken) {
      AsyncStorage.removeItem(storageKeys.authSession).catch((error) => {
        console.log("[AUTH SESSION CLEAR]", error?.message || error);
      });
      return;
    }

    AsyncStorage.setItem(storageKeys.authSession, JSON.stringify(authSession)).catch((error) => {
      console.log("[AUTH SESSION PERSIST]", error?.message || error);
    });
  }, [authSession, storageHydrated]);

  useEffect(() => {
    if (!storageHydrated) {
      return;
    }
    AsyncStorage.setItem(
      storageKeys.cloudSyncMeta,
      JSON.stringify({
        lastCloudSyncAt,
        lastLocalDataChangeAt,
        cloudRemoteUpdatedAt,
      })
    ).catch((error) => {
      console.log("[CLOUD SYNC META PERSIST]", error?.message || error);
    });
  }, [cloudRemoteUpdatedAt, lastCloudSyncAt, lastLocalDataChangeAt, storageHydrated]);

  useEffect(() => {
    if (!storageHydrated || !authSession?.accessToken) {
      setAuthUser(null);
      return;
    }

    let isMounted = true;
    getUser(authSession.accessToken)
      .then((user) => {
        if (!isMounted) {
          return;
        }
        setAuthUser(user);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }
        console.log("[AUTH USER LOAD]", error?.message || error);
        setAuthUser(null);
      });

    return () => {
      isMounted = false;
    };
  }, [authSession?.accessToken, storageHydrated]);

  useEffect(() => {
    if (!storageHydrated || String(authUser?.email || "").toLowerCase() !== demoAccountEmail) {
      return;
    }

    let isMounted = true;
    const seedDemoAccountData = async () => {
      try {
        const seededAccountsRaw = await AsyncStorage.getItem(storageKeys.demoSeededAccounts);
        const seededAccounts = seededAccountsRaw ? JSON.parse(seededAccountsRaw) : {};
        if (seededAccounts[demoAccountEmail]) {
          return;
        }

        const templates = ensureProgramTemplates(workoutTemplates);
        const demoDiary = buildSeedFoodDiaryByDate(todayKey, 14);
        const demoCheckIns = buildDemoCheckIns(todayKey);
        const demoWorkouts = buildDemoCompletedWorkouts(todayKey, templates);
        const pplSplit = getDefaultPremadeSplits(templates).find((split) => split.id === "split-premade-ppl");
        const demoProfile = {
          firstName: "Tosan",
          height: userProfile.height || "5'10\"",
          weightLbs: userProfile.weightLbs || "190",
          sex: userProfile.sex || "Male",
          profilePhotoUri: userProfile.profilePhotoUri || "",
        };

        if (!isMounted) {
          return;
        }

        setUserProfile((current) => ({ ...demoProfile, ...Object.fromEntries(Object.entries(current).filter(([, value]) => Boolean(value))) }));
        setProfileDraft((current) => ({ ...demoProfile, ...Object.fromEntries(Object.entries(current).filter(([, value]) => Boolean(value))) }));
        setFoodDiaryByDate((current) => {
          const serializedCurrent = serializeFoodDiaryByDate(current);
          const next = { ...serializedCurrent };
          Object.entries(demoDiary).forEach(([dateKey, diary]) => {
            const existingEntries = mealOrder.flatMap((meal) => next[dateKey]?.[meal] || []);
            if (!existingEntries.length || existingEntries.every((entry) => entry.source === "seed")) {
              next[dateKey] = diary;
            }
          });
          return next;
        });
        setCheckIns((current) => {
          const byDate = new Map((current || []).map((entry) => [entry.dateKey, entry]));
          demoCheckIns.forEach((entry) => {
            if (!byDate.has(entry.dateKey)) {
              byDate.set(entry.dateKey, entry);
            }
          });
          return Array.from(byDate.values()).sort((left, right) => right.dateKey.localeCompare(left.dateKey));
        });
        setWorkoutTemplates(templates);
        setTrainingSplits((current) => seedPremadeSplitsIfNeeded(current, templates));
        if (pplSplit?.id) {
          setActiveSplitId(pplSplit.id);
        }
        setCompletedWorkouts((current) => {
          const realCurrent = (current || []).filter((workout) => !isPlaceholderCompletedWorkout(workout));
          const existingIds = new Set(realCurrent.map((workout) => workout.id));
          return [
            ...demoWorkouts.filter((workout) => !existingIds.has(workout.id)),
            ...realCurrent,
          ].sort((left, right) => String(right.completedAt).localeCompare(String(left.completedAt)));
        });

        await AsyncStorage.setItem(
          storageKeys.demoSeededAccounts,
          JSON.stringify({ ...seededAccounts, [demoAccountEmail]: new Date().toISOString() })
        );
        expediteCloudSync({ source: "demo-account-seed" });
      } catch (error) {
        console.log("[DEMO ACCOUNT SEED]", error?.message || error);
      }
    };

    seedDemoAccountData();

    return () => {
      isMounted = false;
    };
  }, [authUser?.email, storageHydrated]);

  useEffect(() => {
    if (
      !storageHydrated ||
      String(authUser?.email || "").toLowerCase() !== demoAccountEmail ||
      demoProfileMetricsSeededRef.current
    ) {
      return;
    }

    const templates = ensureProgramTemplates(workoutTemplates);
    const demoCheckIns = buildDemoCheckIns(todayKey);
    const demoWorkouts = buildDemoCompletedWorkouts(todayKey, templates);
    const existingByDate = new Map((checkIns || []).map((entry) => [entry.dateKey, entry]));
    const existingWorkoutIds = new Set((completedWorkouts || []).map((workout) => workout.id));
    const needsDemoMetrics = demoCheckIns.some((entry) => {
      const existing = existingByDate.get(entry.dateKey);
      return !existing || !existing.weightLbs || existing.sleepHours == null;
    });
    const needsDemoWorkouts = demoWorkouts.some((workout) => !existingWorkoutIds.has(workout.id));

    if (!needsDemoMetrics && !needsDemoWorkouts) {
      demoProfileMetricsSeededRef.current = true;
      return;
    }

    demoProfileMetricsSeededRef.current = true;
    if (needsDemoMetrics) {
      setCheckIns((current) => {
        const byDate = new Map((current || []).map((entry) => [entry.dateKey, entry]));
        demoCheckIns.forEach((entry) => {
          const existing = byDate.get(entry.dateKey);
          byDate.set(entry.dateKey, normalizeCheckInEntry({
            ...entry,
            ...existing,
            weightLbs: existing?.weightLbs || entry.weightLbs,
            sleepHours: existing?.sleepHours == null ? entry.sleepHours : existing.sleepHours,
          }));
        });
        return Array.from(byDate.values()).sort((left, right) => right.dateKey.localeCompare(left.dateKey));
      });
      setUserProfile((current) => ({
        ...current,
        weightLbs: current.weightLbs || String(demoCheckIns[demoCheckIns.length - 1]?.weightLbs || "190"),
      }));
      setProfileDraft((current) => ({
        ...current,
        weightLbs: current.weightLbs || String(demoCheckIns[demoCheckIns.length - 1]?.weightLbs || "190"),
      }));
    }
    if (needsDemoWorkouts) {
      setWorkoutTemplates(templates);
      setCompletedWorkouts((current) => {
        const realCurrent = (current || []).filter((workout) => !isPlaceholderCompletedWorkout(workout));
        const currentIds = new Set(realCurrent.map((workout) => workout.id));
        return [
          ...demoWorkouts.filter((workout) => !currentIds.has(workout.id)),
          ...realCurrent,
        ].sort((left, right) => String(right.completedAt).localeCompare(String(left.completedAt)));
      });
    }
    expediteCloudSync({ source: needsDemoWorkouts ? "demo-account-workouts" : "demo-profile-metrics" });
  }, [authUser?.email, checkIns, completedWorkouts, storageHydrated, workoutTemplates]);

  useEffect(() => {
    return () => {
      if (cloudAutoSyncTimeoutRef.current) {
        clearTimeout(cloudAutoSyncTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!storageHydrated || !authSession?.accessToken || !authUser?.id || cloudRestoreAttemptedRef.current) {
      return;
    }

    if (
      hasMeaningfulLocalData({
        foodDiaryByDate,
        checkIns,
        workoutTemplates,
        trainingSplits,
        completedWorkouts,
        userProfile,
      })
    ) {
      cloudRestoreAttemptedRef.current = true;
      return;
    }

    cloudRestoreAttemptedRef.current = true;
    loadCloudDataToLocal({
      overwriteLocal: true,
      accessTokenOverride: authSession.accessToken,
      userIdOverride: authUser.id,
    }).catch((error) => {
      console.log("[CLOUD AUTO LOAD]", error?.message || error);
    });
  }, [
    authSession?.accessToken,
    authUser?.id,
    checkIns,
    completedWorkouts,
    foodDiaryByDate,
    storageHydrated,
    trainingSplits,
    userProfile,
    workoutTemplates,
  ]);

  useEffect(() => {
    if (!storageHydrated || !authSession?.accessToken || !authUser?.id) {
      setCloudRemoteUpdatedAt("");
      cloudAutoDecisionKeyRef.current = "";
      return;
    }

    refreshCloudBackupStatus({
      accessTokenOverride: authSession.accessToken,
      userIdOverride: authUser.id,
      silent: true,
    }).catch((error) => {
      console.log("[CLOUD STATUS REFRESH]", error?.message || error);
    });
  }, [authSession?.accessToken, authUser?.id, storageHydrated]);

  useEffect(() => {
    if (!storageHydrated || !authSession?.accessToken || !authUser?.id) {
      return;
    }

    if (cloudRestoreInProgressRef.current || cloudSyncInFlightRef.current || cloudStatusBusy || authBusy) {
      return;
    }

    const localIsMeaningful = hasMeaningfulLocalData({
      foodDiaryByDate,
      checkIns,
      workoutTemplates,
      trainingSplits,
      completedWorkouts,
      userProfile,
    });

    const cloudIsMeaningful = Boolean(cloudRemoteUpdatedAt);
    if (!localIsMeaningful && !cloudIsMeaningful) {
      return;
    }

    const cloudIsNewer =
      cloudRemoteUpdatedAt &&
      (!lastCloudSyncAt || new Date(cloudRemoteUpdatedAt).getTime() > new Date(lastCloudSyncAt).getTime());
    const localChangedAfterSync =
      lastLocalDataChangeAt &&
      (!lastCloudSyncAt || new Date(lastLocalDataChangeAt).getTime() > new Date(lastCloudSyncAt).getTime());

    const decisionKey = [
      authUser.id,
      lastCloudSyncAt || "none",
      lastLocalDataChangeAt || "none",
      cloudRemoteUpdatedAt || "none",
      localIsMeaningful ? "local" : "no-local",
      cloudIsMeaningful ? "cloud" : "no-cloud",
    ].join("|");

    if (cloudAutoDecisionKeyRef.current === decisionKey) {
      return;
    }

    if (cloudIsNewer && !localChangedAfterSync) {
      cloudAutoDecisionKeyRef.current = decisionKey;
      loadCloudDataToLocal({
        overwriteLocal: true,
        accessTokenOverride: authSession.accessToken,
        userIdOverride: authUser.id,
      }).catch((error) => {
        console.log("[CLOUD AUTO RESOLVE LOAD]", error?.message || error);
      });
      return;
    }

    if (!cloudIsNewer && localChangedAfterSync) {
      cloudAutoDecisionKeyRef.current = decisionKey;
      syncLocalDataToCloud({
        silent: true,
        source: "auto-resolve",
        snapshotOverride: currentCloudSyncSnapshotRef.current,
      }).catch((error) => {
        console.log("[CLOUD AUTO RESOLVE SYNC]", error?.message || error);
      });
      return;
    }

    if (cloudIsNewer && localChangedAfterSync) {
      cloudAutoDecisionKeyRef.current = decisionKey;
      setCloudSyncState("Cloud backup and this device both changed. Review before syncing or loading.");
    }
  }, [
    authBusy,
    authSession?.accessToken,
    authUser?.id,
    checkIns,
    cloudRemoteUpdatedAt,
    cloudStatusBusy,
    completedWorkouts,
    foodDiaryByDate,
    lastCloudSyncAt,
    lastLocalDataChangeAt,
    storageHydrated,
    trainingSplits,
    userProfile,
    workoutTemplates,
  ]);

  useEffect(() => {
    if (!storageHydrated) {
      return;
    }

    if (!authSession?.accessToken || !authUser?.id) {
      if (cloudAutoSyncTimeoutRef.current) {
        clearTimeout(cloudAutoSyncTimeoutRef.current);
      }
      lastCloudSyncSnapshotRef.current = "";
      setCloudSyncPending(false);
      return;
    }

    if (cloudRestoreInProgressRef.current) {
      lastCloudSyncSnapshotRef.current = cloudSyncSnapshot;
      setCloudSyncPending(false);
      return;
    }

    if (!hasMeaningfulLocalData({ foodDiaryByDate, checkIns, workoutTemplates, trainingSplits, completedWorkouts, userProfile })) {
      lastCloudSyncSnapshotRef.current = cloudSyncSnapshot;
      setCloudSyncPending(false);
      return;
    }

    if (!lastCloudSyncSnapshotRef.current) {
      lastCloudSyncSnapshotRef.current = cloudSyncSnapshot;
      return;
    }

    if (cloudSyncSnapshot === lastCloudSyncSnapshotRef.current) {
      setCloudSyncPending(false);
      return;
    }

    setCloudSyncPending(true);
    setCloudSyncState("Local changes detected. Backup will update automatically.");

    if (cloudAutoSyncTimeoutRef.current) {
      clearTimeout(cloudAutoSyncTimeoutRef.current);
    }

    cloudAutoSyncTimeoutRef.current = setTimeout(() => {
      syncLocalDataToCloud({
        silent: true,
        source: "auto",
        snapshotOverride: cloudSyncSnapshot,
      }).catch((error) => {
        console.log("[CLOUD AUTO SYNC]", error?.message || error);
      });
    }, 1800);

    return () => {
      if (cloudAutoSyncTimeoutRef.current) {
        clearTimeout(cloudAutoSyncTimeoutRef.current);
      }
    };
  }, [
    authSession?.accessToken,
    authUser?.id,
    checkIns,
    cloudSyncSnapshot,
    completedWorkouts,
    foodDiaryByDate,
    storageHydrated,
    trainingSplits,
    userProfile,
    workoutTemplates,
  ]);

  useEffect(() => {
    if (!trainingSplits.length) {
      return;
    }
    if (!getActiveSplit(trainingSplits, activeSplitId)) {
      setActiveSplitId(trainingSplits[0].id);
    }
  }, [activeSplitId, trainingSplits]);

  useEffect(() => {
    if (!storageHydrated || !workoutTemplates.length) {
      return;
    }
    setTrainingSplits((current) => seedPremadeSplitsIfNeeded(current, workoutTemplates));
  }, [storageHydrated, workoutTemplates]);

  const addFoodEntry = (meal, entry) => {
    setFoodDiaryByDate((current) => {
      const currentDayDiary = current[selectedDateKey] || emptyDiary();
      return {
        ...current,
        [selectedDateKey]: {
          ...currentDayDiary,
          [meal]: [entry, ...currentDayDiary[meal]],
        },
      };
    });
    expediteCloudSync({ source: "diary-add" });
  };

  const removeFoodEntry = (meal, entryId) => {
    animateQuickRemoval();
    setFoodDiaryByDate((current) => {
      const currentDayDiary = current[selectedDateKey] || emptyDiary();
      return {
        ...current,
        [selectedDateKey]: {
          ...currentDayDiary,
          [meal]: currentDayDiary[meal].filter((entry) => entry.id !== entryId),
        },
      };
    });
    expediteCloudSync({ source: "diary-remove" });
  };

  const toggleFavorite = (food) => {
    setFavorites((current) =>
      current.some((item) => item.id === food.id)
        ? current.filter((item) => item.id !== food.id)
        : [food, ...current]
    );
  };

  const deleteFavorite = (foodId) => {
    setFavorites((current) => current.filter((item) => item.id !== foodId));
  };

  const saveCustomMeal = (mealFood) => {
    setCustomMeals((current) => {
      const filtered = current.filter((item) => item.name.toLowerCase() !== mealFood.name.toLowerCase());
      return [mealFood, ...filtered];
    });
  };

  const saveWorkoutTemplate = (template) => {
    setWorkoutTemplates((current) => {
      const normalizedTemplate = normalizeWorkoutTemplate(template);
      const filtered = current.filter((item) => item.id !== normalizedTemplate.id && item.name.toLowerCase() !== normalizedTemplate.name.toLowerCase());
      return ensureProgramTemplates([normalizedTemplate, ...filtered]);
    });
    expediteCloudSync({ source: "workout-template-save" });
  };

  const copyPresetWorkoutToMyWorkouts = (template) => {
    if (!template) {
      return;
    }
    const copiedTemplate = createWorkoutTemplate({
      id: `user-copy-${template.id}-${Date.now()}`,
      name: template.name,
      description: template.description || `${template.exercises?.length || 0} exercises - Preset copy`,
      exercises: (template.exercises || []).map((exercise) => ({
        name: exercise.name,
        defaultSets: Math.max(exercise.defaultSets || exercise.sets?.length || 1, 1),
        sets: (exercise.sets || []).map((set, index) => ({
          setNumber: index + 1,
          setType: set.setType || "normal",
          weight: set.weight || "0",
          reps: set.reps || "",
        })),
      })),
      isPlaceholder: false,
    });
    saveWorkoutTemplate(copiedTemplate);
    setTemplateMenuId(null);
  };

  const deleteCustomMeal = (mealId) => {
    setCustomMeals((current) => current.filter((item) => item.id !== mealId));
  };

  const deleteWorkoutTemplate = (templateId) => {
    animateQuickRemoval();
    setWorkoutTemplates((current) => current.filter((item) => item.id !== templateId));
    setTrainingSplits((current) =>
      current.map((split) => ({
        ...split,
        scheduledDays: (split.scheduledDays || []).map((day) =>
          day.workoutTemplateId === templateId
            ? {
                ...day,
                label: "Rest",
                workoutTemplateId: null,
                isRestDay: true,
              }
            : day
        ),
      }))
    );
    setSplitEditorDraft((current) =>
      current
        ? {
            ...current,
            scheduledDays: (current.scheduledDays || []).map((day) =>
              day.workoutTemplateId === templateId
                ? {
                    ...day,
                    label: "Rest",
                    workoutTemplateId: null,
                    isRestDay: true,
                  }
                : day
            ),
          }
        : current
    );
    setCustomSplitDraft((current) =>
      current
        ? {
            ...current,
            scheduledDays: (current.scheduledDays || []).map((day) =>
              day.workoutTemplateId === templateId
                ? {
                    ...day,
                    label: "Rest",
                    workoutTemplateId: null,
                    isRestDay: true,
                  }
                : day
            ),
          }
        : current
    );
    expediteCloudSync({ source: "workout-template-delete" });
  };

  const saveCustomFood = (food) => {
    setCustomFoods((current) => {
      const filtered = current.filter((item) => item.name.toLowerCase() !== food.name.toLowerCase());
      return [food, ...filtered];
    });
  };

  const deleteCustomFood = (foodId) => {
    setCustomFoods((current) => current.filter((item) => item.id !== foodId));
  };

  const handleToggleFavorite = (food) => {
    if (food?.source === "custom-food") {
      deleteCustomFood(food.id);
      return;
    }

    toggleFavorite(food);
  };

  const openTemplateBuilder = (template = null, options = {}) => {
    const shouldReturnToProgram = Boolean(options.dayId) && programVisible;
    setTemplateExerciseSearchTerm("");
    setTemplateBuilderTargetDayId(options.dayId || null);
    setTemplateExercisePickerVisible(false);
    setTemplateBuilderReturnContext(shouldReturnToProgram ? { screen: programScreen || "custom" } : null);
    setTemplateEditor(template ? { ...template } : createEmptyTemplateDraft());

    if (shouldReturnToProgram) {
      animateQuickInsert();
      setProgramScreen("template-builder");
      return;
    }
  };

  const addExerciseToTemplateDraft = (exercise) => {
    if (!exercise) {
      return;
    }
    animateQuickInsert();
    setTemplateEditor((current) => {
      if (!current) {
        return current;
      }
      const nextExercise = {
        id: `template-exercise-${exercise.id}-${Date.now()}`,
        exerciseId: exercise.id,
        name: exercise.name,
        defaultSets: 1,
        sets: [createTemplateSet(1)],
      };
      return {
        ...current,
        exercises: [...(current.exercises || []), nextExercise],
      };
    });
    setTemplateExerciseSearchTerm("");
  };

  const removeTemplateDraftExercise = (exerciseId) => {
    animateQuickRemoval();
    setTemplateEditor((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        exercises: (current.exercises || []).filter((exercise) => exercise.id !== exerciseId),
      };
    });
  };

  const addSetToTemplateExercise = (exerciseId) => {
    animateQuickInsert();
    setTemplateEditor((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        exercises: (current.exercises || []).map((exercise) => {
          if (exercise.id !== exerciseId) {
            return exercise;
          }
          const nextSets = [...(exercise.sets || []), createTemplateSet((exercise.sets || []).length + 1)];
          return {
            ...exercise,
            defaultSets: nextSets.length,
            sets: nextSets,
          };
        }),
      };
    });
  };

  const updateTemplateExerciseSetField = (exerciseId, setId, field, value) => {
    setTemplateEditor((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        exercises: (current.exercises || []).map((exercise) => {
          if (exercise.id !== exerciseId) {
            return exercise;
          }
          return {
            ...exercise,
            sets: (exercise.sets || []).map((set) => (
              set.id === setId ? { ...set, [field]: value } : set
            )),
          };
        }),
      };
    });
  };

  const deleteTemplateExerciseSet = (exerciseId, setId) => {
    animateQuickRemoval();
    setTemplateEditor((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        exercises: (current.exercises || []).map((exercise) => {
          if (exercise.id !== exerciseId) {
            return exercise;
          }
          const nextSets = (exercise.sets || [])
            .filter((set) => set.id !== setId)
            .map((set, index) => ({ ...set, setNumber: index + 1 }));
          return {
            ...exercise,
            defaultSets: Math.max(nextSets.length, 1),
            sets: nextSets.length ? nextSets : [createTemplateSet(1)],
          };
        }),
      };
    });
  };

  const openDiaryEntryEditor = (meal, entry) => {
    if (!entry) {
      return;
    }
    setDiaryEntryEditor(createDiaryEntryEditorDraft(meal, entry));
  };

  const saveDiaryEntryEditor = () => {
    if (!diaryEntryEditor?.food) {
      return;
    }
    const updatedEntry = {
      ...createEntry(diaryEntryEditor.food, diaryEntryEditor.servingId, diaryEntryEditor.amount),
      id: diaryEntryEditor.originalEntryId,
      foodName: diaryEntryEditor.food.name,
    };

    setFoodDiaryByDate((current) => {
      const currentDayDiary = current[selectedDateKey] || emptyDiary();
      const nextDiary = Object.fromEntries(
        mealOrder.map((meal) => [
          meal,
          (currentDayDiary[meal] || []).filter((entry) => entry.id !== diaryEntryEditor.originalEntryId),
        ])
      );
      nextDiary[diaryEntryEditor.mealAssignment] = [
        ...(nextDiary[diaryEntryEditor.mealAssignment] || []),
        updatedEntry,
      ];
      return {
        ...current,
        [selectedDateKey]: nextDiary,
      };
    });
    setDiaryEntryEditor(null);
    logAppInfo({
      source: "food-diary",
      action: "edit-entry",
      userMessage: "Food entry updated.",
      details: {
        dateKey: selectedDateKey,
        meal: diaryEntryEditor.mealAssignment,
        foodName: diaryEntryEditor.food.name,
      },
    });
    expediteCloudSync({ source: "diary-edit" });
  };

  const deleteDiaryEntryFromEditor = () => {
    if (!diaryEntryEditor) {
      return;
    }
    animateQuickRemoval();
    setFoodDiaryByDate((current) => {
      const currentDayDiary = current[selectedDateKey] || emptyDiary();
      return {
        ...current,
        [selectedDateKey]: Object.fromEntries(
          mealOrder.map((meal) => [
            meal,
            (currentDayDiary[meal] || []).filter((entry) => entry.id !== diaryEntryEditor.originalEntryId),
          ])
        ),
      };
    });
    setDiaryEntryEditor(null);
    logAppInfo({
      source: "food-diary",
      action: "delete-entry",
      userMessage: "Food entry deleted.",
      details: {
        dateKey: selectedDateKey,
        entryId: diaryEntryEditor.originalEntryId,
      },
    });
    expediteCloudSync({ source: "diary-delete" });
  };

  const saveTemplateEdits = () => {
    if (!templateEditor || templateSavePending) {
      return;
    }
    if (!templateEditor?.name?.trim()) {
      return;
    }
    setTemplateSavePending(true);

    const normalizedTemplate = normalizeWorkoutTemplate({
      ...templateEditor,
      id: templateEditor.id || `workout-template-${Date.now()}`,
      name: templateEditor.name.trim(),
      description: templateEditor.description.trim() || `${(templateEditor.exercises || []).length} exercises`,
      exercises: (templateEditor.exercises || []).map((exercise) => ({
        id: exercise.id,
        exerciseId: exercise.exerciseId,
        name: exercise.name,
        defaultSets: Math.max((exercise.sets || []).length || Number(exercise.defaultSets) || 1, 1),
        sets: normalizeTemplateExerciseSets(exercise),
      })),
      isPlaceholder: false,
    });

    setWorkoutTemplates((current) => {
      const filtered = current.filter((template) => template.id !== normalizedTemplate.id);
      return ensureProgramTemplates([normalizedTemplate, ...filtered]);
    });
    if (templateBuilderTargetDayId) {
      setCustomSplitDraft((current) => current ? ({
        ...current,
        scheduledDays: current.scheduledDays.map((day) => (
          day.id === templateBuilderTargetDayId
            ? {
                ...day,
                label: normalizedTemplate.name,
                workoutTemplateId: normalizedTemplate.id,
                isRestDay: false,
              }
            : day
        )),
      }) : current);
    }
    setTemplateEditor(null);
    setTemplateExerciseSearchTerm("");
    setTemplateBuilderTargetDayId(null);
    setTemplateExercisePickerVisible(false);
    if (templateBuilderReturnContext?.screen) {
      animateQuickRemoval();
      setProgramScreen(templateBuilderReturnContext.screen);
      setProgramVisible(true);
    }
    setTemplateBuilderReturnContext(null);
    expediteCloudSync({ source: "template-builder-save" });
    requestAnimationFrame(() => setTemplateSavePending(false));
  };

  const closeTemplateBuilder = () => {
    setTemplateEditor(null);
    setTemplateExerciseSearchTerm("");
    setTemplateBuilderTargetDayId(null);
    setTemplateExercisePickerVisible(false);
    setTemplateSavePending(false);
    if (templateBuilderReturnContext?.screen) {
      animateQuickRemoval();
      setProgramScreen(templateBuilderReturnContext.screen);
    }
    setTemplateBuilderReturnContext(null);
  };

  useEffect(() => {
    if (!pendingCustomTemplateBuilderDayId || customSplitActionDayId || customSplitWorkoutPickerDayId) {
      return undefined;
    }
    if (!programVisible || programScreen !== "custom") {
      return undefined;
    }
    pendingTemplateBuilderInteractionRef.current?.cancel?.();
    pendingTemplateBuilderInteractionRef.current = InteractionManager.runAfterInteractions(() => {
      openTemplateBuilder(null, { dayId: pendingCustomTemplateBuilderDayId });
      setPendingCustomTemplateBuilderDayId(null);
      pendingTemplateBuilderInteractionRef.current = null;
    });
    return () => {
      pendingTemplateBuilderInteractionRef.current?.cancel?.();
      pendingTemplateBuilderInteractionRef.current = null;
    };
  }, [
    pendingCustomTemplateBuilderDayId,
    customSplitActionDayId,
    customSplitWorkoutPickerDayId,
    programVisible,
    programScreen,
  ]);

  const startEmptyWorkout = () => {
    setRootActiveTab("workout");
    setActiveWorkout(buildActiveWorkout("Empty Workout"));
    setWorkoutLaunchView("home");
    triggerWorkoutTimerPulse();
  };

  const startSavedWorkout = (template) => {
    setTemplateMenuId(null);
    setRootActiveTab("workout");
    setActiveWorkout(buildActiveWorkout(template.name, template.exercises, template.id));
    setWorkoutLaunchView("home");
    triggerWorkoutTimerPulse();
  };

  const animateBottomNavToIndex = (nextIndex, duration = 110) => {
    if (!bottomNavWidth) {
      return;
    }
    const gap = 6;
    const padding = 6;
    const buttonWidth = (bottomNavWidth - (padding * 2) - (gap * (tabs.length - 1))) / tabs.length;
    bottomNavTranslateX.stopAnimation();
    Animated.timing(bottomNavTranslateX, {
      toValue: padding + (nextIndex * (buttonWidth + gap)),
      duration,
      useNativeDriver: true,
    }).start();
  };

  const setRootActiveTab = (nextTabKey) => {
    if (nextTabKey === activeTab) {
      return;
    }
    const nextIndex = Math.max(0, tabs.findIndex((tab) => tab.key === nextTabKey));
    animateBottomNavToIndex(nextIndex);
    if (deferredTabSwitchRef.current) {
      clearTimeout(deferredTabSwitchRef.current);
      deferredTabSwitchRef.current = null;
    }
    if (nextTabKey === "progress") {
      setDashboardCarouselIndex(0);
      setActiveTab(nextTabKey);
      return;
    }
    setActiveTab(nextTabKey);
  };

  const openModalFlowSafely = (openCallback) => {
    Keyboard.dismiss();
    setKeyboardVisible(false);
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        openCallback?.();
      });
    });
  };

  const openProgramScreen = () => {
    openModalFlowSafely(() => {
      setProgramVisible(true);
      setProgramScreen("home");
      setProgramSelectedDateKey(todayKey);
      setProgramWeekStartKey(getDateKey(getStartOfWeek(new Date())));
      setProgramCalendarMonthKey(getDateKey(getStartOfMonth(new Date())));
      setProgramCalendarVisible(false);
      setProgramSaveState("");
    });
  };

  const openDiaryTab = () => {
    setRootActiveTab("diary");
  };

  const openProgressStatsCheckIn = () => {
    setProgressStatsVisible(false);
    openModalFlowSafely(() => {
      openCheckInScreen();
    });
  };

  const closeProgramScreen = () => {
    setProgramVisible(false);
    setProgramScreen("home");
    setSplitEditorDraft(null);
    setSplitCellMenu(null);
    setCustomSplitDraft(null);
    setCustomSplitWorkoutPickerDayId(null);
    setCustomSplitActionDayId(null);
    setProgramCalendarVisible(false);
    setExerciseInsightTarget(null);
    setProgramSaveState("");
  };

  const closeExerciseInsight = () => {
    Animated.timing(exerciseInsightSheetTranslateY, {
      toValue: 360,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setExerciseInsightTarget(null));
  };

  const openExerciseInsight = (exercise) => {
    if (!exercise) {
      return;
    }

    setExerciseInsightTarget({
      id: exercise?.id || null,
      exerciseId: exercise?.exerciseId || exercise?.id || null,
      name: exercise?.name || "Exercise",
    });
  };

  const selectProgramDate = (dateKey) => {
    if (!dateKey) {
      return;
    }

    setProgramSelectedDateKey(dateKey);
    setProgramWeekStartKey(getDateKey(getStartOfWeek(parseDateKey(dateKey))));
    setProgramCalendarMonthKey(getDateKey(getStartOfMonth(parseDateKey(dateKey))));
  };

  const openProgramCalendar = () => {
    setProgramCalendarMonthKey(getDateKey(getStartOfMonth(parseDateKey(programSelectedDateKey || todayKey))));
    setProgramCalendarVisible(true);
  };

  useEffect(() => {
    if (!exerciseInsightTarget) {
      return;
    }

    exerciseInsightSheetTranslateY.setValue(360);
    Animated.spring(exerciseInsightSheetTranslateY, {
      toValue: 0,
      tension: 78,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [exerciseInsightSheetTranslateY, exerciseInsightTarget]);

  const exerciseInsightSheetResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => (
        Math.abs(gestureState.dy) > 8 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
      ),
      onPanResponderMove: (_, gestureState) => {
        exerciseInsightSheetTranslateY.setValue(Math.max(0, gestureState.dy));
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 1.15) {
          closeExerciseInsight();
          return;
        }

        Animated.spring(exerciseInsightSheetTranslateY, {
          toValue: 0,
          tension: 78,
          friction: 12,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(exerciseInsightSheetTranslateY, {
          toValue: 0,
          tension: 78,
          friction: 12,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const openSplitEditor = () => {
    const baseSplit = activeSplit || getDefaultPremadeSplits(workoutTemplates)[0];
    setSplitEditorDraft({
      id: baseSplit?.id || "split-premade-ppl",
      name: baseSplit?.name || "Push / Pull / Legs",
      splitType: baseSplit?.splitType || "PPL",
      restDays: baseSplit?.restDays || 1,
      isManuallyEdited: Boolean(baseSplit?.isManuallyEdited),
      scheduledDays: (baseSplit?.scheduledDays || buildScheduleFromPremadeSplit("PPL", 1, workoutTemplates)).map((day) => ({ ...day })),
    });
    setSplitCellMenu(null);
    setProgramScreen("edit");
    setProgramSaveState("");
  };

  const loadSplitIntoEditor = (split) => {
    if (!split) {
      return;
    }
    setSplitEditorDraft({
      id: split.id,
      name: split.name,
      splitType: split.splitType || "CUSTOM",
      restDays: split.restDays,
      isManuallyEdited: Boolean(split.isManuallyEdited),
      scheduledDays: split.scheduledDays.map((day) => ({ ...day })),
    });
    setSplitCellMenu(null);
    setProgramSaveState("");
  };

  const updateSplitDraftType = (splitType) => {
    setSplitEditorDraft((current) => {
      if (!current) {
        return current;
      }
      const splitNames = {
        PPL: "Push / Pull / Legs",
        UL: "Upper / Lower",
        FB: "Full Body",
      };
      return {
        ...current,
        splitType,
        name: splitNames[splitType] || current.name,
        isManuallyEdited: false,
        scheduledDays: buildScheduleFromPremadeSplit(splitType, current.restDays, workoutTemplates),
      };
    });
    setSplitCellMenu(null);
  };

  const updateSplitDraftRestDays = (restDays) => {
    setSplitEditorDraft((current) => {
      if (!current) {
        return current;
      }
      if (String(current.splitType || "").toUpperCase() === "CUSTOM") {
        return {
          ...current,
          restDays,
          isManuallyEdited: true,
          scheduledDays: adjustCustomSplitRestDays(current.scheduledDays, restDays, workoutTemplates),
        };
      }
      return {
        ...current,
        restDays,
        isManuallyEdited: false,
        scheduledDays: buildScheduleFromPremadeSplit(current.splitType, restDays, workoutTemplates),
      };
    });
    setSplitCellMenu(null);
  };

  const moveSplitDraftDay = (fromIndex, direction) => {
    setSplitEditorDraft((current) => {
      if (!current) {
        return current;
      }
      const toIndex = Math.max(0, Math.min(6, fromIndex + direction));
      return {
        ...current,
        isManuallyEdited: true,
        scheduledDays: reorderScheduledDay(current.scheduledDays, fromIndex, toIndex),
      };
    });
  };

  const openSplitCellMenu = (day, index) => {
    if (!splitEditorDraft) {
      return;
    }
    setSplitCellMenu({
      index,
      dayId: day.id,
      currentLabel: day.label,
      options: getSplitEditorDayOptions(splitEditorDraft, workoutTemplates),
    });
  };

  const applySplitCellOption = (option) => {
    if (!splitCellMenu) {
      return;
    }
    setSplitEditorDraft((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        isManuallyEdited: true,
        scheduledDays: current.scheduledDays.map((day, index) => {
          if (index !== splitCellMenu.index) {
            return day;
          }
          if (option.type === "rest") {
            return {
              ...day,
              label: "Rest",
              workoutTemplateId: null,
              isRestDay: true,
            };
          }
          const templateId = option.workoutTemplateId || getWorkoutTemplateForSplitLabel(option.label, workoutTemplates)?.id || null;
          return {
            ...day,
            label: option.label,
            workoutTemplateId: templateId,
            isRestDay: false,
          };
        }),
      };
    });
    setSplitCellMenu(null);
  };

  const saveSplitDraft = () => {
    if (!splitEditorDraft) {
      return;
    }
    const isCustomSplitDraft = String(splitEditorDraft.splitType || "").toUpperCase() === "CUSTOM";
    const defaultSchedule = isCustomSplitDraft
      ? splitEditorDraft.scheduledDays
      : buildScheduleFromPremadeSplit(splitEditorDraft.splitType, splitEditorDraft.restDays, workoutTemplates);
    const isCustomizedOrder = isCustomSplitDraft
      ? true
      : splitEditorDraft.scheduledDays.some((day, index) => {
          const baseline = defaultSchedule[index];
          return baseline
            ? baseline.label !== day.label || baseline.workoutTemplateId !== day.workoutTemplateId || baseline.isRestDay !== day.isRestDay
            : false;
        });
    const nextSplit = createTrainingSplit({
      id: splitEditorDraft.id,
      name: splitEditorDraft.name,
      splitType: splitEditorDraft.splitType,
      baseSplitType: isCustomSplitDraft ? null : splitEditorDraft.splitType,
      isCustomizedOrder,
      isManuallyEdited: Boolean(splitEditorDraft.isManuallyEdited),
      type: splitEditorDraft.id.startsWith("split-premade") ? "premade" : "custom",
      restDays: splitEditorDraft.restDays,
      scheduledDays: splitEditorDraft.scheduledDays,
      isPlaceholder: splitEditorDraft.id.startsWith("split-premade"),
    });
    setTrainingSplits((current) => current.map((split) => (split.id === nextSplit.id ? nextSplit : split)));
    setActiveSplitId(nextSplit.id);
    setProgramScreen("home");
    setSplitEditorDraft(null);
    setSplitCellMenu(null);
    setProgramSaveState("Split saved");
    expediteCloudSync({ source: "split-save" });
  };

  const openCustomSplitScreen = () => {
    setCustomSplitDraft(createEmptyCustomSplitDraft(1));
    setCustomSplitWorkoutPickerDayId(null);
    setCustomSplitActionDayId(null);
    setProgramScreen("custom");
    setProgramSaveState("");
  };

  const editSelectedSplit = () => {
    const selectedSplit = splitEditorDraft || activeSplit;
    if (!selectedSplit) {
      return;
    }
    setCustomSplitDraft({
      id: selectedSplit.id,
      name: selectedSplit.name || getSplitDisplayName(selectedSplit),
      lengthWeeks: selectedSplit.splitLengthWeeks || getSplitLengthWeeks(selectedSplit.scheduledDays || []),
      scheduledDays: buildCustomSplitScheduledDays(
        selectedSplit.splitLengthWeeks || getSplitLengthWeeks(selectedSplit.scheduledDays || []),
        selectedSplit.scheduledDays || []
      ),
    });
    setSplitManagementMenuVisible(false);
    setCustomSplitWorkoutPickerDayId(null);
    setCustomSplitActionDayId(null);
    setProgramScreen("custom");
    setProgramSaveState("");
  };

  const deleteSelectedSplit = () => {
    const selectedId = splitEditorDraft?.id || activeSplitId;
    if (!selectedId) {
      return;
    }
    Alert.alert(
      "Delete split?",
      "This removes the selected split from My Program. Your saved workouts will not be deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setTrainingSplits((current) => {
              const next = current.filter((split) => split.id !== selectedId);
              const safeSplits = next.length ? next : getDefaultPremadeSplits(workoutTemplates);
              const nextActive = safeSplits[0];
              if (nextActive) {
                setActiveSplitId(nextActive.id);
                loadSplitIntoEditor(nextActive);
              }
              return safeSplits;
            });
            setSplitManagementMenuVisible(false);
            setProgramSaveState("Split deleted");
            expediteCloudSync({ source: "split-delete" });
          },
        },
      ]
    );
  };

  const restoreDefaultSplits = () => {
    Alert.alert(
      "Restore default splits?",
      "This restores Push Pull Legs, Upper Lower, and Full Body with the current preset workout assignments.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          style: "destructive",
          onPress: () => {
            const defaults = getDefaultPremadeSplits(workoutTemplates);
            const customSplits = trainingSplits.filter((split) => split.type === "custom" && !split.isPlaceholder);
            const nextSplits = [...defaults, ...customSplits];
            const nextActive = defaults[0] || nextSplits[0];
            setTrainingSplits(nextSplits);
            if (nextActive) {
              setActiveSplitId(nextActive.id);
              loadSplitIntoEditor(nextActive);
            }
            setSplitManagementMenuVisible(false);
            setProgramSaveState("Default splits restored");
            expediteCloudSync({ source: "split-restore-defaults" });
          },
        },
      ]
    );
  };

  const updateCustomSplitDay = (dayTarget, updater) => {
    setCustomSplitDraft((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        scheduledDays: current.scheduledDays.map((day, index) => (
          index === dayTarget || day.id === dayTarget
            ? updater(day)
            : day
        )),
      };
    });
  };

  const assignTemplateToCustomDay = (dayTarget, template) => {
    if (!template) {
      return;
    }
    updateCustomSplitDay(dayTarget, (currentDay) => ({
      ...currentDay,
      label: template.name,
      workoutTemplateId: template.id,
      isRestDay: false,
    }));
  };

  const setCustomDayRest = (dayTarget) => {
    updateCustomSplitDay(dayTarget, (currentDay) => ({
      ...currentDay,
      label: "Rest",
      workoutTemplateId: null,
      isRestDay: true,
    }));
  };

  const setCustomSplitLengthWeeks = (lengthWeeks) => {
    setCustomSplitDraft((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        lengthWeeks,
        scheduledDays: buildCustomSplitScheduledDays(lengthWeeks, current.scheduledDays),
      };
    });
    setCustomSplitWorkoutPickerDayId(null);
    setCustomSplitActionDayId(null);
  };

  const saveCustomSplit = () => {
    if (!customSplitDraft) {
      return;
    }

    const splitId = customSplitDraft.id || `training-split-custom-${Date.now()}`;
    const scheduledDays = customSplitDraft.scheduledDays.map((day, index) => {
      if (day.isRestDay || !day.workoutTemplateId) {
        return {
          ...day,
          orderIndex: index,
          label: "Rest",
          workoutTemplateId: null,
          isRestDay: true,
        };
      }
      const matchedTemplate = workoutTemplates.find((template) => template.id === day.workoutTemplateId) || null;

      return {
        ...day,
        orderIndex: index,
        label: matchedTemplate?.name || day.label || "Workout",
        workoutTemplateId: matchedTemplate?.id || day.workoutTemplateId || null,
        isRestDay: false,
      };
    });

    const nextSplit = createTrainingSplit({
      id: splitId,
      name: customSplitDraft.name.trim() || "Custom Split",
      splitType: "CUSTOM",
      splitLengthWeeks: customSplitDraft.lengthWeeks || getSplitLengthWeeks(customSplitDraft.scheduledDays),
      baseSplitType: null,
      isCustomizedOrder: true,
      isManuallyEdited: true,
      type: "custom",
      restDays: scheduledDays.filter((day) => day.isRestDay).length,
      scheduledDays,
      isPlaceholder: false,
    });
    setTrainingSplits((current) => [nextSplit, ...current.filter((split) => split.id !== nextSplit.id)]);
    setActiveSplitId(nextSplit.id);
    setProgramScreen("edit");
    setSplitEditorDraft({
      id: nextSplit.id,
      name: nextSplit.name,
      splitType: nextSplit.splitType,
      splitLengthWeeks: nextSplit.splitLengthWeeks,
      restDays: nextSplit.restDays,
      isManuallyEdited: Boolean(nextSplit.isManuallyEdited),
      scheduledDays: nextSplit.scheduledDays.map((day) => ({ ...day })),
    });
    setCustomSplitDraft(null);
    setCustomSplitWorkoutPickerDayId(null);
    setCustomSplitActionDayId(null);
    setProgramSaveState("Custom split saved");
    expediteCloudSync({ source: "custom-split-save" });
  };

  const startScheduledWorkout = (template) => {
    if (!template) {
      return;
    }
    closeProgramScreen();
    setRootActiveTab("workout");
    setActiveWorkout(buildActiveWorkout(template.name, template.exercises, template.id));
    setWorkoutLaunchView("home");
    triggerWorkoutTimerPulse();
  };

  const resetWorkoutFinishFlow = () => {
    setFinishWorkoutVisible(false);
    setSaveAsTemplateDraftName("");
    setFinishWorkoutPromptStep("prompt");
  };

  const closeFinishedWorkoutSummary = () => {
    setFinishedWorkoutSummary(null);
  };

  const openTimerEditor = () => {
    const totalMinutes = Math.max(Math.round(activeWorkoutElapsedSeconds / 60), 0);
    setTimerDraftHours(Math.min(Math.floor(totalMinutes / 60), 12));
    setTimerDraftMinutes(totalMinutes % 60);
    setTimerEditorVisible(true);
  };

  const closeTimerEditor = () => {
    setTimerEditorVisible(false);
  };

  const toggleWorkoutTimerPaused = () => {
    setActiveWorkout((current) => {
      if (!current) {
        return current;
      }

      if (current.isTimerPaused) {
        return {
          ...current,
          isTimerPaused: false,
          timerLastStartedAt: new Date().toISOString(),
        };
      }

      return {
        ...current,
        elapsedSecondsOffset: getActiveWorkoutElapsedSeconds(current),
        isTimerPaused: true,
        timerLastStartedAt: null,
      };
    });
  };

  const saveTimerAdjustment = () => {
    const nextSeconds = (Math.max(Number(timerDraftHours) || 0, 0) * 3600) + (Math.max(Number(timerDraftMinutes) || 0, 0) * 60);
    setActiveWorkout((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        elapsedSecondsOffset: nextSeconds,
        timerLastStartedAt: current.isTimerPaused ? null : new Date().toISOString(),
      };
    });
    setWorkoutClockNow(Date.now());
    setTimerEditorVisible(false);
  };

  const shiftActiveWorkoutDate = (offset) => {
    setActiveWorkout((current) => current ? { ...current, dateKey: shiftDateKey(current.dateKey || todayKey, offset) } : current);
  };

  const shiftHistoryEditorDate = (offset) => {
    setHistoryEditorWorkout((current) => {
      if (!current) {
        return current;
      }
      const nextDateKey = shiftDateKey(current.dateKey || getDateKey(new Date(current.completedAt || new Date())), offset);
      const time = new Date(current.completedAt || current.startedAt || new Date());
      const nextCompletedAt = `${nextDateKey}T${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}:${String(time.getSeconds()).padStart(2, "0")}.000`;
      return {
        ...current,
        dateKey: nextDateKey,
        completedAt: nextCompletedAt,
      };
    });
  };

  const openFinishWorkoutFlow = () => {
    setSaveAsTemplateDraftName(activeWorkout?.name === "Empty Workout" ? "" : activeWorkout?.name || "");
    setFinishWorkoutPromptStep(activeWorkout?.templateId && activeWorkoutTemplateChanged ? "template-update" : "prompt");
    setFinishWorkoutVisible(true);
  };

  const completeWorkout = ({ saveTemplate = false, templateName = "", updateTemplate = false, saveHistory = true } = {}) => {
    if (!activeWorkout) {
      return;
    }

    if (saveHistory && activeWorkout.exercises.length) {
      const completedDateKey = activeWorkout.dateKey || getDateKey();
      const now = new Date();
      const completedAt = `${completedDateKey}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.000`;
      const summary = buildWorkoutSummary(activeWorkout, completedWorkouts, completedAt);
      const timedSummary = {
        ...summary,
        durationSeconds: activeWorkoutElapsedSeconds,
        durationLabel: formatWorkoutDuration(activeWorkoutElapsedSeconds),
      };
      const completedWorkoutEntry = createCompletedWorkoutRecord({
        templateId: activeWorkout.templateId || null,
        name: activeWorkout.name,
        startedAt: activeWorkout.startedAt,
        completedAt,
        exercises: activeWorkout.exercises,
        summary: timedSummary,
      });

      setCompletedWorkouts((current) => [
        completedWorkoutEntry,
        ...current,
      ]);

      if (saveTemplate) {
        const trimmedName = templateName.trim();
        const template = createWorkoutTemplate({
          name: trimmedName,
          description: `${activeWorkout.exercises.length} exercises - Custom workout`,
          exercises: activeWorkout.exercises.map((exercise) => ({
            name: exercise.name,
            defaultSets: Math.max(exercise.sets.length, 1),
            sets: (exercise.sets || []).map((set, index) => ({
              setNumber: index + 1,
              setType: set.setType || "normal",
              weight: set.weight || "0",
              reps: set.reps || "",
            })),
          })),
          isPlaceholder: false,
        });
        saveWorkoutTemplate(template);
      }

      if (updateTemplate && activeWorkout.templateId) {
        setWorkoutTemplates((current) =>
          current.map((template) => (
            template.id === activeWorkout.templateId
              ? {
                  ...template,
                  exercises: activeWorkout.exercises.map((exercise) => ({
                    id: `template-exercise-${exercise.exerciseId}-${exercise.sets.length}`,
                    exerciseId: exercise.exerciseId,
                    name: exercise.name,
                    defaultSets: Math.max(exercise.sets.length, 1),
                    sets: (exercise.sets || []).map((set, index) => ({
                      setNumber: index + 1,
                      setType: set.setType || "normal",
                      weight: set.weight || "0",
                      reps: set.reps || "",
                    })),
                  })),
                  description: `${activeWorkout.exercises.length} exercises - Updated from completed workout`,
                }
              : template
          ))
        );
      }

      setFinishedWorkoutSummary(completedWorkoutEntry);
      setHistoryDateKey(completedWorkoutEntry.dateKey);
    }

    setActiveWorkout(null);
    setWorkoutLaunchView("home");
    setExercisePickerVisible(false);
    setExerciseSearchTerm("");
    setTimerEditorVisible(false);
    resetWorkoutFinishFlow();
    if (saveHistory || saveTemplate || updateTemplate) {
      expediteCloudSync({ source: "workout-complete" });
    }
  };

  const updateHistoryWorkoutSetField = (exerciseId, setId, field, value) => {
    setHistoryEditorWorkout((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        exercises: current.exercises.map((exercise) => (
          exercise.id !== exerciseId
            ? exercise
            : {
                ...exercise,
                sets: exercise.sets.map((set) => (
                  set.id === setId ? { ...set, [field]: value } : set
                )),
              }
        )),
      };
    });
  };

  const saveHistoryWorkoutEdits = () => {
    if (!historyEditorWorkout) {
      return;
    }

    const recalculatedHistoryWorkout = createCompletedWorkoutRecord({
      ...historyEditorWorkout,
      exercises: historyEditorWorkout.exercises,
      summary: buildWorkoutSummary(
        historyEditorWorkout,
        completedWorkouts.filter((workout) => workout.id !== historyEditorWorkout.id),
        historyEditorWorkout.completedAt,
        historyEditorWorkout.summary?.durationSeconds
      ),
    });

    setCompletedWorkouts((current) =>
      current.map((workout) => workout.id === historyEditorWorkout.id ? cloneCompletedWorkout(recalculatedHistoryWorkout) : workout)
    );
    closeHistoryWorkoutDetails();
    expediteCloudSync({ source: "history-edit" });
  };

  const openExercisePicker = () => {
    setExerciseSearchTerm("");
    setExercisePickerVisible(true);
  };

  const getWorkoutSetRowKey = (exerciseInstanceId, setId) => `${exerciseInstanceId}:${setId}`;

  const scrollActiveWorkoutSetIntoView = (rowKey, offset = 150) => {
    const rowLayout = activeWorkoutSetRowLayoutsRef.current[rowKey];
    if (!rowLayout) {
      return;
    }

    const nextY = Math.max(0, rowLayout.y - offset);
    requestAnimationFrame(() => {
      activeWorkoutScrollRef.current?.scrollTo?.({ y: nextY, animated: true });
    });
  };

  const focusActiveWorkoutInput = (exerciseInstanceId, setId) => {
    scrollActiveWorkoutSetIntoView(getWorkoutSetRowKey(exerciseInstanceId, setId), Platform.OS === "ios" ? 170 : 130);
  };

  const addExerciseToWorkout = (exercise) => {
    if (!exercise) {
      return;
    }

    setActiveWorkout((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        exercises: [...current.exercises, createWorkoutExercise(exercise)],
      };
    });
    setExercisePickerVisible(false);
    setExerciseSearchTerm("");
  };

  const deleteWorkoutExercise = (exerciseInstanceId) => {
    animateQuickRemoval();
    setActiveWorkout((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        exercises: current.exercises.filter((exercise) => exercise.id !== exerciseInstanceId),
      };
    });
  };

  const addSetToExercise = (exerciseInstanceId) => {
    setActiveWorkout((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        exercises: current.exercises.map((exercise) => {
          if (exercise.id !== exerciseInstanceId) {
            return exercise;
          }

          return {
            ...exercise,
            sets: [...exercise.sets, createWorkoutSet(exercise.sets.length + 1)],
          };
        }),
      };
    });
  };

  const updateWorkoutSetField = (exerciseInstanceId, setId, field, value) => {
    setActiveWorkout((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        exercises: current.exercises.map((exercise) => {
          if (exercise.id !== exerciseInstanceId) {
            return exercise;
          }

          return {
            ...exercise,
            sets: exercise.sets.map((set) => (
              set.id === setId ? { ...set, [field]: value } : set
            )),
          };
        }),
      };
    });
  };

  const findNextUncompletedWorkoutSetKey = (workout, completedExerciseInstanceId, completedSetId) => {
    const rows = (workout?.exercises || []).flatMap((exercise) =>
      (exercise.sets || []).map((set) => ({
        exerciseInstanceId: exercise.id,
        setId: set.id,
        completed: exercise.id === completedExerciseInstanceId && set.id === completedSetId ? true : Boolean(set.completed),
      }))
    );
    const currentIndex = rows.findIndex((row) => row.exerciseInstanceId === completedExerciseInstanceId && row.setId === completedSetId);
    const nextRow = rows.slice(Math.max(currentIndex + 1, 0)).find((row) => !row.completed);
    return nextRow ? getWorkoutSetRowKey(nextRow.exerciseInstanceId, nextRow.setId) : "";
  };

  const toggleWorkoutSetCompleted = (exerciseInstanceId, setId) => {
    Keyboard.dismiss();
    let nextUncompletedRowKey = "";
    setActiveWorkout((current) => {
      if (!current) {
        return current;
      }

      const targetExercise = current.exercises.find((exercise) => exercise.id === exerciseInstanceId);
      const targetSet = targetExercise?.sets?.find((set) => set.id === setId);
      if (targetSet && !targetSet.completed) {
        nextUncompletedRowKey = findNextUncompletedWorkoutSetKey(current, exerciseInstanceId, setId);
      }

      return {
        ...current,
        exercises: current.exercises.map((exercise) => {
          if (exercise.id !== exerciseInstanceId) {
            return exercise;
          }

          return {
            ...exercise,
            sets: exercise.sets.map((set) => (
              set.id === setId ? { ...set, completed: !set.completed } : set
            )),
          };
        }),
      };
    });

    if (nextUncompletedRowKey) {
      setTimeout(() => scrollActiveWorkoutSetIntoView(nextUncompletedRowKey, 140), 90);
    }
  };

  const deleteWorkoutSet = (exerciseInstanceId, setId) => {
    setActiveWorkout((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        exercises: current.exercises.map((exercise) => {
          if (exercise.id !== exerciseInstanceId) {
            return exercise;
          }

          const remainingSets = exercise.sets
            .filter((set) => set.id !== setId)
            .map((set, index) => ({ ...set, setNumber: index + 1 }));

          return {
            ...exercise,
            sets: remainingSets.length ? remainingSets : [createWorkoutSet(1)],
          };
        }),
      };
    });
  };

  const openSetTypeMenu = (exerciseInstanceId, setId) => {
    setSetTypeMenu({ exerciseInstanceId, setId });
  };

  const applyWorkoutSetType = (nextType) => {
    if (!setTypeMenu) {
      return;
    }
    setActiveWorkout((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        exercises: current.exercises.map((exercise) => {
          if (exercise.id !== setTypeMenu.exerciseInstanceId) {
            return exercise;
          }
          return {
            ...exercise,
            sets: exercise.sets.map((set) => (
              set.id === setTypeMenu.setId ? { ...set, setType: nextType } : set
            )),
          };
        }),
      };
    });
    setSetTypeMenu(null);
  };

  const renderSavedWorkoutCard = (template) => (
    <View key={template.id} style={[styles.savedWorkoutCard, expandedWorkoutTemplateId === template.id && styles.savedWorkoutCardExpanded]}>
      <View style={styles.savedWorkoutRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.savedWorkoutTitle}>{template.name}</Text>
          <Text style={styles.savedWorkoutMeta}>
            {formatMuscleGroupsInline(getTemplateMuscleGroups(template), template.description || `${template.exercises.length} exercises`)}
          </Text>
        </View>
        {!template.isPlaceholder ? (
          <View style={styles.savedWorkoutActions}>
            <Pressable onPress={() => setTemplateMenuId((current) => current === template.id ? null : template.id)} style={({ pressed }) => [styles.templateManageButton, pressed && styles.darkPressablePressed]}>
              <Image source={threeDotsMenuIcon} style={styles.templateMenuButtonIcon} resizeMode="contain" />
              <Text style={styles.templateManageButtonText}>Manage</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.savedWorkoutFooter}>
        <Text style={styles.savedWorkoutSummary}>{template.isPlaceholder ? "Preset workout" : "Custom workout"}</Text>
        <Pressable onPress={() => startSavedWorkout(template)} style={({ pressed }) => [styles.inlineAddButton, pressed && styles.primaryButtonPressed]}>
          <Text style={styles.inlineAddButtonText}>Start</Text>
        </Pressable>
      </View>

      {renderWorkoutExerciseList(
        template.exercises || [],
        expandedWorkoutTemplateId === template.id,
        () => setExpandedWorkoutTemplateId((current) => current === template.id ? null : template.id),
        "No exercises programmed yet.",
        `${template.exercises.length || 0} Exercises`
      )}

      {templateMenuId === template.id ? (
        <View style={styles.templateMenuCard}>
          <Pressable onPress={() => {
            openTemplateBuilder(template);
            setTemplateMenuId(null);
          }} style={styles.templateMenuAction}>
            <Text style={styles.templateMenuActionText}>Edit</Text>
          </Pressable>
          <Pressable onPress={() => {
            deleteWorkoutTemplate(template.id);
            setTemplateMenuId(null);
          }} style={styles.templateMenuAction}>
            <Image source={trashActionIcon} style={styles.templateMenuDeleteIcon} resizeMode="contain" />
            <Text style={[styles.templateMenuActionText, styles.templateMenuDeleteText]}>Delete</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  const renderWorkoutStart = () => (
    <ScrollView style={styles.screenScroll} contentContainerStyle={screenContentStyle} showsVerticalScrollIndicator={false}>
      <View style={[styles.savedWorkoutCard, styles.todayWorkoutHeroCard]}>
        <Text style={styles.eyebrow}>Today</Text>
        <Text style={styles.todayWorkoutHeroTitle}>
          {todaysProgramSchedule?.scheduledDay?.isRestDay
            ? "Rest Day"
            : todaysProgramSchedule?.template?.name || todaysProgramSchedule?.scheduledDay?.label || "No Workout Scheduled"}
        </Text>
        <Text style={styles.todayWorkoutHeroMeta}>
          {todaysProgramSchedule?.scheduledDay?.isRestDay
            ? "Recovery - Mobility - Nutrition"
            : formatMuscleGroupsInline(todaysWorkoutMuscleGroups, todaysProgramSchedule?.template?.description || "Quick access to today's scheduled training session.")}
        </Text>

        {todaysProgramSchedule?.template ? (
          <>
            {renderWorkoutExerciseList(
              todaysProgramSchedule.template.exercises || [],
              workoutHomeExercisesExpanded,
              () => setWorkoutHomeExercisesExpanded((current) => !current),
              "No exercises programmed yet.",
              `${todaysProgramSchedule.template.exercises?.length || 0} Exercises`,
              {
                label: "Edit",
                onPress: () => openTemplateBuilder(todaysProgramSchedule.template),
              }
            )}
            <Pressable onPress={() => startSavedWorkout(todaysProgramSchedule.template)} style={({ pressed }) => [styles.workoutStartPrimaryButton, pressed && styles.primaryButtonPressed]}>
              <Text style={styles.workoutPrimaryButtonText}>Start Workout</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.savedWorkoutFooter}>
            <Text style={styles.savedWorkoutSummary}>
              {todaysProgramSchedule?.scheduledDay?.isRestDay
                ? "No lifting scheduled"
                : "Set up a split in My Program or start empty"}
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.workoutStartCard, styles.workoutQuickStartCard]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Quick Start</Text>
          <Text style={styles.workoutQuickStartTitle}>Start Empty Workout</Text>
          <Text style={styles.workoutQuickStartMeta}>Blank session</Text>
        </View>
        <Pressable onPress={startEmptyWorkout} style={({ pressed }) => [styles.inlineAddButton, styles.workoutQuickStartButton, pressed && styles.primaryButtonPressed]}>
          <Text style={styles.inlineAddButtonText}>Start</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.savedWorkoutHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Saved</Text>
            <Text style={styles.cardTitle}>My Workouts</Text>
            <Text style={styles.cardSubtle}>Start a saved split instantly or manage your reusable workouts.</Text>
          </View>
          <Pressable onPress={() => openTemplateBuilder()} style={({ pressed }) => [styles.programAddSplitButton, pressed && styles.scalePressSmall]}>
            <Text style={styles.programAddSplitButtonText}>+</Text>
          </Pressable>
        </View>

        <View style={styles.workoutFilterRow}>
          {[
            { key: "all", label: "All" },
            { key: "preset", label: "Preset" },
            { key: "custom", label: "Custom" },
            { key: "recent", label: "Recent" },
          ].map((filter) => (
            <Pressable
              key={filter.key}
              onPress={() => setWorkoutTemplateFilter(filter.key)}
              style={({ pressed }) => [
                styles.workoutFilterPill,
                workoutTemplateFilter === filter.key && styles.workoutFilterPillActive,
                pressed && styles.darkPressablePressed,
              ]}
            >
              <Text style={[styles.workoutFilterPillText, workoutTemplateFilter === filter.key && styles.workoutFilterPillTextActive]}>
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {previewWorkoutTemplates.map(renderSavedWorkoutCard)}

        {showWorkoutOverflowRows || isWorkoutsExpanded ? (
          <Animated.View
            style={[
              styles.savedWorkoutOverflowWrap,
              {
                height: savedWorkoutOverflowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, Math.max(savedWorkoutOverflowHeight, 1)],
                }),
                opacity: savedWorkoutOverflowAnim,
              },
            ]}
          >
            <View
              onLayout={(event) => {
                const nextHeight = Math.ceil(event.nativeEvent.layout.height);
                if (nextHeight > 0 && nextHeight !== savedWorkoutOverflowHeight) {
                  setSavedWorkoutOverflowHeight(nextHeight);
                }
              }}
            >
              {overflowWorkoutTemplates.map(renderSavedWorkoutCard)}
            </View>
          </Animated.View>
        ) : null}

        {filteredWorkoutTemplates.length > SAVED_WORKOUT_PREVIEW_LIMIT ? (
          <Pressable onPress={toggleSavedWorkoutsExpanded} style={({ pressed }) => [styles.savedWorkoutsToggleButton, pressed && styles.darkPressablePressed]}>
            <Text style={styles.savedWorkoutsToggleText}>
              {isWorkoutsExpanded ? "Show less" : "Show more"}
            </Text>
          </Pressable>
        ) : null}

        {!filteredWorkoutTemplates.length ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {workoutTemplateFilter === "preset" ? "Preset workouts are loading." : "No personal workouts yet. Create one or use the Preset filter."}
            </Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );

  const renderWorkoutLogger = () => (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
    <ScrollView
      ref={activeWorkoutScrollRef}
      style={styles.screenScroll}
      contentContainerStyle={[screenContentStyle, styles.activeWorkoutContent, keyboardVisible && styles.activeWorkoutContentKeyboard]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      onScroll={(event) => {
        activeWorkoutScrollYRef.current = event.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
    >
      <View style={styles.card}>
        <View style={styles.activeWorkoutHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{activeWorkout?.name || "Workout"}</Text>
            <View style={styles.activeWorkoutMetaRow}>
              <Text style={styles.cardSubtle}>
                {activeWorkout?.startedAt ? new Date(activeWorkout.startedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : ""}
              </Text>
              <Animated.View
                style={[
                  styles.timerPillWrap,
                  {
                    opacity: workoutTimerPulse,
                    transform: [
                      {
                        scale: workoutTimerPulse.interpolate({
                          inputRange: [0.52, 1],
                          outputRange: [1.05, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Pressable onPress={openTimerEditor} style={styles.timerPill}>
                  <Image source={require("./assets/ui/clock-timer.png")} style={styles.timerIcon} resizeMode="contain" />
                  <Text style={styles.timerPillText}>{formatWorkoutDuration(activeWorkoutElapsedSeconds)}</Text>
                </Pressable>
              </Animated.View>
              <Pressable onPress={toggleWorkoutTimerPaused} style={({ pressed }) => [styles.timerPauseButton, pressed && styles.darkPressablePressed]}>
                <Text style={styles.timerPauseButtonText}>{activeWorkout?.isTimerPaused ? "Resume" : "Pause"}</Text>
              </Pressable>
            </View>
            <View style={styles.workoutDateEditorRow}>
              <Pressable onPress={() => shiftActiveWorkoutDate(-1)} style={({ pressed }) => [styles.dateNavButtonTiny, pressed && styles.darkPressablePressed]}>
                <TriangleArrowIcon direction="left" size={16} color={theme.textSubtle} />
              </Pressable>
              <Text style={styles.workoutDateEditorText}>{formatDateCaption(activeWorkout?.dateKey || todayKey)}</Text>
              <Pressable onPress={() => shiftActiveWorkoutDate(1)} style={({ pressed }) => [styles.dateNavButtonTiny, pressed && styles.darkPressablePressed]}>
                <TriangleArrowIcon size={16} color={theme.textSubtle} />
              </Pressable>
            </View>
          </View>
          <Pressable onPress={openFinishWorkoutFlow} style={({ pressed }) => [styles.secondaryPillButton, pressed && styles.finishButtonPressed]}>
            <Text style={styles.secondaryPillButtonText}>Finish</Text>
          </Pressable>
        </View>

        <View style={styles.workoutActionRow}>
          <Pressable onPress={openExercisePicker} style={({ pressed }) => [styles.inlineAddButton, styles.activeWorkoutAddExerciseButton, pressed && styles.primaryButtonPressed]}>
            <Text style={styles.inlineAddButtonText}>+ Add Exercise</Text>
          </Pressable>
        </View>

        {!activeWorkout?.exercises?.length ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No exercises yet. Add your first exercise to begin logging sets.</Text>
          </View>
        ) : null}
      </View>

      {activeWorkout?.exercises?.map((exercise, exerciseIndex) => (
        <View key={exercise.id} style={styles.workoutExerciseCard}>
          <View style={styles.workoutExerciseHeader}>
            <Pressable onPress={() => openExerciseInsight(exercise)} style={styles.workoutExerciseInfoTrigger}>
              <Text style={styles.workoutExerciseName}>{exercise.name}</Text>
              <Text style={styles.workoutExerciseInfoText}>
                {formatMuscleGroupsInline(getWorkoutExerciseDefinition(exercise)?.muscleGroups || exercise.muscleGroups || [], "Muscles not assigned")}
              </Text>
            </Pressable>
            <Pressable onPress={() => deleteWorkoutExercise(exercise.id)} style={styles.rowDeleteButton}>
              <Image source={trashActionIcon} style={styles.rowDeleteButtonIcon} resizeMode="contain" />
            </Pressable>
          </View>

          <View style={styles.setTableHeader}>
            <Text style={[styles.setHeaderCell, styles.setHeaderIndex]}>Set</Text>
            <Text style={[styles.setHeaderCell, styles.setHeaderPrev]}>Prev</Text>
            <Text style={[styles.setHeaderCell, styles.setHeaderInput]}>Weight</Text>
            <Text style={[styles.setHeaderCell, styles.setHeaderInput]}>Reps</Text>
            <Text style={[styles.setHeaderCell, styles.setHeaderCheck]}>Done</Text>
          </View>

          {exercise.sets.map((set) => (
            <View
              key={set.id}
              style={[styles.workoutSetRow, set.completed && styles.workoutSetRowCompleted]}
              onLayout={(event) => {
                activeWorkoutSetRowLayoutsRef.current[getWorkoutSetRowKey(exercise.id, set.id)] = event.nativeEvent.layout;
              }}
            >
              <Pressable onPress={() => openSetTypeMenu(exercise.id, set.id)} style={styles.setTypeButton}>
                <Text style={[styles.setCellText, styles.setHeaderIndex, { color: getWorkoutSetTypeMeta(set.setType).color }]}>{set.setNumber}</Text>
              </Pressable>
              <Text style={[styles.setPrevText, styles.setHeaderPrev]}>{getPreviousSetPreview(exercise, set, exercise.sets, completedWorkouts)}</Text>
              <TextInput
                value={set.weight}
                onChangeText={(value) => updateWorkoutSetField(exercise.id, set.id, "weight", value)}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#73857d"
                style={[styles.setInput, styles.setHeaderInput]}
                onFocus={() => focusActiveWorkoutInput(exercise.id, set.id)}
              />
              <TextInput
                value={set.reps}
                onChangeText={(value) => updateWorkoutSetField(exercise.id, set.id, "reps", value)}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#73857d"
                style={[styles.setInput, styles.setHeaderInput]}
                onFocus={() => focusActiveWorkoutInput(exercise.id, set.id)}
              />
              <Pressable onPress={() => toggleWorkoutSetCompleted(exercise.id, set.id)} style={[styles.setCheck, set.completed && styles.setCheckActive, styles.setHeaderCheck]}>
                <Text style={[styles.setCheckText, set.completed && styles.setCheckTextActive]}>{set.completed ? "\u2713" : "\u25CB"}</Text>
              </Pressable>
              <Pressable onPress={() => deleteWorkoutSet(exercise.id, set.id)} style={styles.setDeleteButton}>
                <Text style={styles.setDeleteButtonText}>x</Text>
              </Pressable>
            </View>
          ))}

          <Pressable onPress={() => addSetToExercise(exercise.id)} style={styles.addSetWideButton}>
            <Text style={styles.addSetWideButtonText}>+ Add Set</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderWorkout = () => (activeWorkout ? renderWorkoutLogger() : renderWorkoutStart());

  const renderExerciseInsightSheet = () => {
    if (!exerciseInsightTarget) {
      return null;
    }

    return (
      <View style={styles.exerciseInsightOverlay} pointerEvents="box-none">
        <Pressable style={styles.exerciseInsightBackdrop} onPress={closeExerciseInsight} />
        <Animated.View
          style={[
            styles.exerciseInsightSheet,
            { transform: [{ translateY: exerciseInsightSheetTranslateY }] },
          ]}
          {...exerciseInsightSheetResponder.panHandlers}
        >
          <View style={styles.exerciseInsightHandleWrap}>
            <View style={styles.exerciseInsightHandle} />
          </View>

          <View style={styles.exerciseInsightHeader}>
            <View>
              <Text style={styles.eyebrow}>Exercise Details</Text>
              <Text style={styles.modalTitle}>{exerciseInsight?.name || exerciseInsightTarget?.name || "Exercise"}</Text>
            </View>
          </View>

          <View style={styles.exerciseInsightContent}>
            <View style={styles.exerciseInsightSectionCard}>
              <Text style={styles.eyebrow}>{exerciseInsight?.equipment || "Training"}</Text>
              <Text style={styles.cardTitle}>Target Muscles</Text>
              <View style={styles.exerciseInsightMuscleRow}>
                {(exerciseInsight?.muscleGroups || ["Not mapped yet"]).map((muscle) => (
                  <View key={muscle} style={styles.exerciseInsightMuscleChip}>
                    <Text style={styles.exerciseInsightMuscleChipText}>{muscle}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.exerciseInsightSectionCard}>
              <Text style={styles.selectionLabel}>Personal Records</Text>

              <View style={styles.exerciseInsightRecordCard}>
                <Text style={styles.exerciseInsightRecordLabel}>Best Volume Set</Text>
                {exerciseInsight?.bestVolumeSet ? (
                  <>
                    <Text style={styles.exerciseInsightRecordValue}>{exerciseInsight.bestVolumeSet.label}</Text>
                    <Text style={styles.exerciseInsightRecordDetail}>
                      {exerciseInsight.bestVolumeSet.detail}
                      {exerciseInsight.bestVolumeSet.dateLabel ? ` - ${exerciseInsight.bestVolumeSet.dateLabel}` : ""}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.exerciseInsightEmptyText}>No completed volume sets logged yet.</Text>
                )}
              </View>

              <View style={styles.exerciseInsightRecordCard}>
                <Text style={styles.exerciseInsightRecordLabel}>Heaviest Weight Performed</Text>
                {exerciseInsight?.heaviestSet ? (
                  <>
                    <Text style={styles.exerciseInsightRecordValue}>{exerciseInsight.heaviestSet.label}</Text>
                    <Text style={styles.exerciseInsightRecordDetail}>
                      {exerciseInsight.heaviestSet.detail}
                      {exerciseInsight.heaviestSet.dateLabel ? ` - ${exerciseInsight.heaviestSet.dateLabel}` : ""}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.exerciseInsightEmptyText}>No loaded sets logged yet.</Text>
                )}
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    );
  };

  const renderWorkoutExerciseList = (
    exercises = [],
    expanded = false,
    onToggle = () => {},
    emptyLabel = "No exercises programmed yet.",
    toggleLabel = "Exercises",
    accessoryAction = null
  ) => (
    <View style={styles.savedWorkoutExerciseSection}>
      <Pressable onPress={onToggle} style={({ pressed }) => [styles.savedWorkoutExerciseToggle, pressed && styles.darkPressablePressed]}>
        <View style={styles.exerciseTogglePrimary}>
          <Image source={bulletDotIcon} style={styles.exerciseToggleBullet} resizeMode="contain" />
          <Text style={styles.selectionLabel}>{toggleLabel}</Text>
        </View>
        <View style={styles.exerciseToggleActions}>
          {accessoryAction ? (
            <Pressable
              onPress={(event) => {
                event.stopPropagation?.();
                accessoryAction.onPress?.();
              }}
              style={({ pressed }) => [styles.savedWorkoutAccessoryButton, pressed && styles.darkPressablePressed]}
            >
              <Text style={styles.savedWorkoutAccessoryButtonText}>{accessoryAction.label}</Text>
            </Pressable>
          ) : null}
          <Text style={styles.savedWorkoutExpandIcon}>{expanded ? "-" : "+"}</Text>
        </View>
      </Pressable>

      {expanded ? (
        exercises.length ? (
          <View style={styles.savedWorkoutExerciseList}>
            {exercises.map((exercise) => (
              <Pressable key={exercise.id} onPress={() => openExerciseInsight(exercise)} style={({ pressed }) => [styles.savedWorkoutExerciseRow, pressed && styles.darkPressablePressed]}>
                <Text style={styles.savedWorkoutExerciseName}>{exercise.name}</Text>
                {"defaultSets" in exercise ? (
                  <Text style={styles.savedWorkoutExerciseMeta}>{exercise.defaultSets} sets</Text>
                ) : (
                  <Text style={styles.savedWorkoutExerciseMeta}>View</Text>
                )}
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{emptyLabel}</Text>
          </View>
        )
      ) : null}
    </View>
  );

  const openHistoryWorkoutDetails = (workout) => {
    const clonedWorkout = cloneCompletedWorkout(workout);
    if (settingsScreen === "profile") {
      setHistoryEditorReturnScreen("profile");
      setSettingsScreen(null);
      requestAnimationFrame(() => {
        setTimeout(() => {
          setHistoryEditorWorkout(clonedWorkout);
        }, 30);
      });
      return;
    }
    setHistoryEditorReturnScreen(null);
    setHistoryEditorWorkout(clonedWorkout);
  };

  const closeHistoryWorkoutDetails = () => {
    const returnScreen = historyEditorReturnScreen;
    setHistoryEditorWorkout(null);
    setHistoryEditorReturnScreen(null);
    if (returnScreen === "profile") {
      requestAnimationFrame(() => {
        setProfileDraft(userProfile);
        setProfileSaveState("");
        setSettingsScreen("profile");
      });
    }
  };

  const renderCompletedWorkoutCards = (workouts = []) => (
    workouts.length ? (
      workouts.map((workout) => (
        <Pressable key={workout.id} onPress={() => openHistoryWorkoutDetails(workout)} style={styles.dashboardHistoryWorkoutCard}>
          <View style={styles.savedWorkoutRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.savedWorkoutTitle}>{workout.name}</Text>
              <Text style={styles.savedWorkoutMeta}>
                {new Date(workout.startedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} - {workout.exercises.length} exercises
              </Text>
            </View>
            <Text style={styles.historyWorkoutAction}>View</Text>
          </View>
          <Text style={styles.historyWorkoutSummary}>
            {workout.exercises.map((exercise) => exercise.name).slice(0, 3).join(" - ")}
          </Text>
        </Pressable>
      ))
    ) : null
  );

  const cycleDashboardRange = (metricId) => {
    setDashboardRanges((current) => ({
      ...current,
      [metricId]: getDashboardNextRange(current[metricId] || "30 Days"),
    }));
  };

  const handleDashboardCardPress = (cardId) => {
    if (cardId === "program") {
      openProgramScreen();
      return;
    }

    if (cardId === "settings") {
      openModalFlowSafely(() => {
        setSettingsScreen("home");
      });
      return;
    }

    setDashboardPanel({
      title: "Ask Coach",
      body: "This is a placeholder coach surface for now. We can connect it to your future AI coaching flow without redesigning the dashboard.",
    });
  };

  const handleSettingsOptionPress = (option) => {
    if (option.type === "account") {
      openModalFlowSafely(() => {
        setAccountActionState("");
        setCloudSyncState("");
        setSettingsScreen("account");
      });
      return;
    }

    if (option.type === "profile") {
      openModalFlowSafely(() => {
        setProfileDraft(userProfile);
        setProfileSaveState("");
        setSettingsReturnScreen("home");
        setSettingsScreen("personal-info");
      });
      return;
    }

    openModalFlowSafely(() => {
      setSettingsPlaceholder(option);
      setSettingsScreen("placeholder");
    });
  };

  const openSettingsScreen = () => {
    openModalFlowSafely(() => {
      setSettingsReturnScreen(null);
      setSettingsScreen("home");
    });
  };

  const openProfileScreen = () => {
    openModalFlowSafely(() => {
      setProfileDraft(userProfile);
      setProfileSaveState("");
      setSettingsReturnScreen(null);
      setSettingsScreen("profile");
    });
  };

  const closeSettingsFlow = () => {
    setSettingsScreen(null);
    setSettingsPlaceholder(null);
    setSettingsReturnScreen(null);
    setProfileSaveState("");
    setAccountActionState("");
    setCloudSyncState("");
  };

  const saveProfile = async () => {
    const heightParts = parseHeightParts(profileDraft?.height || userProfile?.height);
    const normalizedProfile = {
      firstName: String(profileDraft?.firstName || "").trim(),
      height: formatHeightParts(heightParts.feet, heightParts.inches),
      weightLbs: String(userProfile?.weightLbs || profileDraft?.weightLbs || "").trim(),
      sex: String(profileDraft?.sex || userProfile?.sex || ""),
      profilePhotoUri: String(profileDraft?.profilePhotoUri || userProfile?.profilePhotoUri || ""),
    };

    try {
      setUserProfile(normalizedProfile);
      setProfileDraft(normalizedProfile);
      let localProfileSaved = false;
      let localPhotoSaved = false;
      try {
        await AsyncStorage.setItem(profileStorageKey, JSON.stringify(sanitizeProfileForStorage(normalizedProfile)));
        localProfileSaved = true;
      } catch (profileStorageError) {
        logAppError({
          source: "profile",
          action: "save-profile-local",
          userMessage: "Profile details could not be saved locally.",
          error: profileStorageError,
          details: {
            key: profileStorageKey,
            userId: authUser?.id || "signed-out",
          },
        });
      }
      try {
        await AsyncStorage.setItem(profilePhotoStorageKey, normalizedProfile.profilePhotoUri);
        localPhotoSaved = true;
      } catch (photoError) {
        logAppError({
          source: "profile-photo",
          action: "save-photo-local",
          userMessage: "Profile photo could not be saved locally.",
          error: photoError,
          details: {
            key: profilePhotoStorageKey,
            userId: authUser?.id || "signed-out",
            hasPhoto: Boolean(normalizedProfile.profilePhotoUri),
          },
        });
      }
      if (authUser?.id) {
        profileScopedLoadRef.current = authUser.id;
      }
      if (!localProfileSaved && !localPhotoSaved && !authUser?.id) {
        throw new Error("Profile could not be persisted.");
      }
      setProfileSaveState("Saved");
      expediteCloudSync({ source: "profile-save" });
    } catch (error) {
      setProfileSaveState("Save failed");
      logAppError({
        source: "profile",
        action: "save-profile",
        userMessage: "Profile changes could not be saved.",
        error,
        details: {
          key: profileStorageKey,
          photoKey: profilePhotoStorageKey,
          userId: authUser?.id || "signed-out",
          hasPhoto: Boolean(normalizedProfile.profilePhotoUri),
        },
      });
    }
  };

  const openPersonalInfoFromProfile = () => {
    setProfileDraft(userProfile);
    setProfileSaveState("");
    setSettingsReturnScreen("profile");
    setSettingsScreen("personal-info");
  };

  const openAccountFromProfile = () => {
    setAccountActionState("");
    setCloudSyncState("");
    setSettingsReturnScreen("profile");
    setSettingsScreen("account");
  };

  const pickProfilePhoto = async () => {
    try {
      const permissionResponse = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResponse.granted) {
        setProfileSaveState("Photo permission needed");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.35,
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        return;
      }

      const pickedAsset = result.assets[0];
      const durableUri = await persistPickedImage(pickedAsset, {
        folderName: "profile-photos",
        filePrefix: "profile-photo",
        scopeId: authUser?.id || authUser?.email || "signed-out",
      });
      setProfileDraft((current) => ({ ...current, profilePhotoUri: durableUri }));
      setProfileSaveState("Photo selected");
      logAppInfo({
        source: "profile-photo",
        action: "select-photo",
        userMessage: "Profile photo selected.",
        details: {
          key: profilePhotoStorageKey,
          userId: authUser?.id || "signed-out",
          storageMode: durableUri.startsWith("data:") ? "data-uri" : "document-file-uri",
          hasUri: Boolean(durableUri),
          mimeType: pickedAsset?.mimeType || "",
        },
      });
    } catch (error) {
      const message = error?.message || String(error || "Unknown photo picker error");
      setProfileSaveState(`Photo failed: ${message.slice(0, 56)}`);
      logAppError({
        source: "profile-photo",
        action: "pick-photo",
        userMessage: "Profile photo selection failed.",
        error,
        details: {
          key: profilePhotoStorageKey,
          userId: authUser?.id || "signed-out",
          message,
        },
      });
    }
  };

  const updateProfileHeightPart = (part, direction) => {
    const currentParts = parseHeightParts(profileDraft.height || userProfile.height);
    const nextParts = {
      ...currentParts,
      [part]: part === "feet"
        ? Math.min(Math.max(currentParts.feet + direction, 3), 8)
        : Math.min(Math.max(currentParts.inches + direction, 0), 11),
    };
    setProfileDraft((current) => ({
      ...current,
      height: formatHeightParts(nextParts.feet, nextParts.inches),
    }));
  };

  const loadCloudProfileIntoLocal = async (accessToken, userId) => {
    const cloudProfile = await loadCloudProfile(accessToken, userId);
    if (!cloudProfile) {
      return null;
    }

    const localProfile = {
      ...mapCloudProfileToLocal(cloudProfile),
      profilePhotoUri: resolvePersistedImageUri({
        folderName: "profile-photos",
        filePrefix: "profile-photo",
        scopeId: userId || authUser?.id || authUser?.email || "signed-out",
        fallbackUri:
          mapCloudProfileToLocal(cloudProfile).profilePhotoUri ||
          userProfile.profilePhotoUri ||
          profileDraft.profilePhotoUri ||
          "",
      }),
    };
    setUserProfile(localProfile);
    setProfileDraft(localProfile);
    return localProfile;
  };

  const refreshCloudBackupStatus = async ({ accessTokenOverride = "", userIdOverride = "", silent = false } = {}) => {
    const effectiveAccessToken = accessTokenOverride || authSession?.accessToken || "";
    const effectiveUserId = userIdOverride || authUser?.id || "";

    if (!effectiveAccessToken || !effectiveUserId) {
      return null;
    }

    if (!silent) {
      setCloudSyncState("Checking cloud backup...");
    }

    setCloudStatusBusy(true);
    try {
      const [cloudProfile, cloudDiaryRows, cloudCheckIns, cloudTemplatePayload, cloudProgramPayload, cloudCompletedPayload] = await Promise.all([
        loadCloudProfile(effectiveAccessToken, effectiveUserId),
        loadAllDiaryEntries(effectiveAccessToken, effectiveUserId),
        loadCloudCheckIns(effectiveAccessToken, effectiveUserId),
        loadAllWorkoutTemplates(effectiveAccessToken, effectiveUserId),
        loadAllTrainingPrograms(effectiveAccessToken, effectiveUserId),
        loadAllCompletedWorkouts(effectiveAccessToken, effectiveUserId),
      ]);

      const cloudUpdatedAt = getMostRecentTimestamp(
        cloudProfile?.updated_at || cloudProfile?.created_at || "",
        getLatestRowTimestamp(cloudDiaryRows),
        getLatestRowTimestamp(cloudCheckIns),
        getLatestRowTimestamp(cloudTemplatePayload?.templates || []),
        getLatestRowTimestamp(cloudTemplatePayload?.exercises || []),
        getLatestRowTimestamp(cloudTemplatePayload?.sets || []),
        getLatestRowTimestamp(cloudProgramPayload?.programs || []),
        getLatestRowTimestamp(cloudProgramPayload?.days || []),
        getLatestRowTimestamp(cloudCompletedPayload?.workouts || []),
        getLatestRowTimestamp(cloudCompletedPayload?.exercises || []),
        getLatestRowTimestamp(cloudCompletedPayload?.sets || [])
      );

      setCloudRemoteUpdatedAt(cloudUpdatedAt);

      if (!silent) {
        setCloudSyncState(
          cloudUpdatedAt
            ? `Cloud backup checked. Latest cloud update was ${formatRelativeTimestamp(cloudUpdatedAt)}.`
            : "Cloud backup is empty for this account."
        );
      }

      return {
        updatedAt: cloudUpdatedAt,
        hasData: Boolean(
          cloudProfile ||
            cloudDiaryRows.length ||
            cloudCheckIns.length ||
            (cloudTemplatePayload?.templates || []).length ||
            (cloudProgramPayload?.programs || []).length ||
            (cloudCompletedPayload?.workouts || []).length
        ),
      };
    } catch (error) {
      if (!silent) {
        setCloudSyncState(error?.message || "Unable to check cloud backup.");
      }
      return null;
    } finally {
      setCloudStatusBusy(false);
    }
  };

  const reconcileCloudAfterAuth = async ({ accessToken, userId }) => {
    if (!accessToken || !userId) {
      return;
    }

    const status = await refreshCloudBackupStatus({
      accessTokenOverride: accessToken,
      userIdOverride: userId,
      silent: true,
    }).catch(() => null);

    const localIsMeaningful = hasMeaningfulLocalData({
      foodDiaryByDate,
      checkIns,
      workoutTemplates,
      trainingSplits,
      completedWorkouts,
      userProfile,
    });
    const cloudIsMeaningful = Boolean(status?.hasData || status?.updatedAt);
    const cloudIsNewer =
      status?.updatedAt &&
      (!lastCloudSyncAt || new Date(status.updatedAt).getTime() > new Date(lastCloudSyncAt).getTime());
    const localChangedAfterSync =
      localIsMeaningful &&
      (!lastCloudSyncAt ||
        (lastLocalDataChangeAt && new Date(lastLocalDataChangeAt).getTime() > new Date(lastCloudSyncAt).getTime()));

    if (cloudIsMeaningful && (!localIsMeaningful || cloudIsNewer)) {
      await loadCloudDataToLocal({
        overwriteLocal: true,
        accessTokenOverride: accessToken,
        userIdOverride: userId,
      }).catch(() => null);
      setAccountActionState("Signed in.");
      return;
    }

    if (localIsMeaningful && (!cloudIsMeaningful || localChangedAfterSync)) {
      await syncLocalDataToCloud({
        silent: true,
        source: "post-auth",
        snapshotOverride: currentCloudSyncSnapshotRef.current,
        accessTokenOverride: accessToken,
        userIdOverride: userId,
      }).catch(() => null);
      setAccountActionState("Signed in.");
      return;
    }

    setAccountActionState("Signed in.");
  };

  const loadCloudDataToLocal = async ({ overwriteLocal = false, accessTokenOverride = "", userIdOverride = "" } = {}) => {
    const effectiveAccessToken = accessTokenOverride || authSession?.accessToken || "";
    const effectiveUserId = userIdOverride || authUser?.id || "";

    if (!effectiveAccessToken || !effectiveUserId) {
      setCloudSyncState("Sign in first.");
      return false;
    }

    const shouldProtectLocalData =
      !overwriteLocal &&
      hasMeaningfulLocalData({
        foodDiaryByDate,
        checkIns,
        workoutTemplates,
        trainingSplits,
        completedWorkouts,
        userProfile,
      });

    if (shouldProtectLocalData) {
      setCloudSyncState("Local data already exists. Use Load Cloud Data only when you want to replace this device's current data.");
      return false;
    }

    if (cloudAutoSyncTimeoutRef.current) {
      clearTimeout(cloudAutoSyncTimeoutRef.current);
    }

    cloudAutoDecisionKeyRef.current = "";
    cloudRestoreInProgressRef.current = true;
    setAuthBusy(true);
    setCloudSyncPending(false);
    setCloudSyncState("Loading cloud data...");
    try {
      const [cloudProfile, cloudDiaryRows, cloudCheckIns, cloudTemplatePayload, cloudProgramPayload, cloudCompletedPayload] = await Promise.all([
        loadCloudProfile(effectiveAccessToken, effectiveUserId),
        loadAllDiaryEntries(effectiveAccessToken, effectiveUserId),
        loadCloudCheckIns(effectiveAccessToken, effectiveUserId),
        loadAllWorkoutTemplates(effectiveAccessToken, effectiveUserId),
        loadAllTrainingPrograms(effectiveAccessToken, effectiveUserId),
        loadAllCompletedWorkouts(effectiveAccessToken, effectiveUserId),
      ]);
      const cloudLoadedUpdatedAt = getMostRecentTimestamp(
        cloudProfile?.updated_at || cloudProfile?.created_at || "",
        getLatestRowTimestamp(cloudDiaryRows),
        getLatestRowTimestamp(cloudCheckIns),
        getLatestRowTimestamp(cloudTemplatePayload?.templates || []),
        getLatestRowTimestamp(cloudTemplatePayload?.exercises || []),
        getLatestRowTimestamp(cloudTemplatePayload?.sets || []),
        getLatestRowTimestamp(cloudProgramPayload?.programs || []),
        getLatestRowTimestamp(cloudProgramPayload?.days || []),
        getLatestRowTimestamp(cloudCompletedPayload?.workouts || []),
        getLatestRowTimestamp(cloudCompletedPayload?.exercises || []),
        getLatestRowTimestamp(cloudCompletedPayload?.sets || [])
      );

      if (cloudProfile) {
        const mappedCloudProfile = mapCloudProfileToLocal(cloudProfile);
        const localProfile = {
          ...mappedCloudProfile,
          profilePhotoUri: resolvePersistedImageUri({
            folderName: "profile-photos",
            filePrefix: "profile-photo",
            scopeId: effectiveUserId,
            fallbackUri:
              mappedCloudProfile.profilePhotoUri ||
              userProfile.profilePhotoUri ||
              profileDraft.profilePhotoUri ||
              "",
          }),
        };
        setUserProfile(localProfile);
        setProfileDraft(localProfile);
      }

      if (cloudDiaryRows.length) {
        setFoodDiaryByDate(mergeDiaryWithSeed(buildLocalDiaryByDateFromCloudRows(cloudDiaryRows), todayKey, 90));
      }

      if (cloudCheckIns.length) {
        setCheckIns(cloudCheckIns.map(normalizeCheckInEntry));
      }

      const localTemplates = ensureProgramTemplates(buildLocalWorkoutTemplatesFromCloud(cloudTemplatePayload));
      if (localTemplates.length) {
        setWorkoutTemplates(localTemplates);
      }

      const localSplits = seedPremadeSplitsIfNeeded(buildLocalTrainingSplitsFromCloud(cloudProgramPayload, localTemplates), localTemplates);
      if (localSplits.length) {
        setTrainingSplits(localSplits);
        const activeCloudProgram = (cloudProgramPayload.programs || []).find((program) => program.is_active);
        if (activeCloudProgram) {
          const matchingLocalSplit =
            localSplits.find((split) => split.id === String(activeCloudProgram.id)) ||
            localSplits.find((split) => split.id === getCanonicalPremadeSplitId(activeCloudProgram));
          if (matchingLocalSplit?.id) {
            setActiveSplitId(matchingLocalSplit.id);
          }
        }
      }

      const localCompletedWorkouts = buildLocalCompletedWorkoutsFromCloud(cloudCompletedPayload, localTemplates);
      if (localCompletedWorkouts.length) {
        setCompletedWorkouts(localCompletedWorkouts);
      }

      setLastCloudSyncAt(new Date().toISOString());
      if (cloudLoadedUpdatedAt) {
        setCloudRemoteUpdatedAt(cloudLoadedUpdatedAt);
      }
      setCloudSyncState("Cloud data loaded onto this device.");
      return true;
    } catch (error) {
      setCloudSyncState(error?.message || "Cloud load failed.");
      return false;
    } finally {
      setAuthBusy(false);
      InteractionManager.runAfterInteractions(() => {
        cloudRestoreInProgressRef.current = false;
        lastCloudSyncSnapshotRef.current = currentCloudSyncSnapshotRef.current;
        lastLocalSnapshotRef.current = currentCloudSyncSnapshotRef.current;
        setCloudSyncPending(false);
      });
    }
  };

  const handleAccountSignUp = async () => {
    const email = accountDraft.email.trim().toLowerCase();
    const password = accountDraft.password;
    if (!email || !password) {
      setAccountActionState("Enter email and password.");
      return;
    }

    setAuthBusy(true);
    setAccountActionState("");
    try {
      const payload = await signUpWithPassword(email, password, {
        first_name: userProfile.firstName || "",
      });

      const accessToken = payload?.access_token || payload?.session?.access_token || "";
      const refreshToken = payload?.refresh_token || payload?.session?.refresh_token || "";
      const user = payload?.user || payload?.session?.user || null;

      if (accessToken) {
        cloudRestoreAttemptedRef.current = false;
        cloudRestoreInProgressRef.current = false;
        cloudAutoDecisionKeyRef.current = "";
        setAuthSession({
          accessToken,
          refreshToken,
          expiresAt: payload?.expires_at || payload?.session?.expires_at || null,
          tokenType: payload?.token_type || payload?.session?.token_type || "bearer",
          userEmail: user?.email || email,
        });
        setAuthUser(user);
        setCloudSyncState("");
        setAccountActionState("Account created. You're signed in.");
        await reconcileCloudAfterAuth({ accessToken, userId: user?.id }).catch(() => null);
      } else {
        setAccountActionState("Account created. Check your email to confirm sign-in if required.");
      }
    } catch (error) {
      setAccountActionState(error?.message || "Unable to create account.");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleAccountSignIn = async () => {
    const email = accountDraft.email.trim().toLowerCase();
    const password = accountDraft.password;
    if (!email || !password) {
      setAccountActionState("Enter email and password.");
      return;
    }

    setAuthBusy(true);
    setAccountActionState("");
    try {
      const payload = await signInWithPassword(email, password);
      const accessToken = payload?.access_token || "";
      const refreshToken = payload?.refresh_token || "";
      const user = await getUser(accessToken);

      cloudRestoreAttemptedRef.current = false;
      cloudRestoreInProgressRef.current = false;
      cloudAutoDecisionKeyRef.current = "";
      setAuthSession({
        accessToken,
        refreshToken,
        expiresAt: payload?.expires_at || null,
        tokenType: payload?.token_type || "bearer",
        userEmail: user?.email || email,
      });
      setAuthUser(user);
      setCloudSyncState("");
      setAccountActionState("Signed in.");
      await reconcileCloudAfterAuth({ accessToken, userId: user?.id }).catch(() => null);
    } catch (error) {
      setAccountActionState(error?.message || "Unable to sign in.");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleAccountSignOut = async () => {
    setAuthBusy(true);
    setAccountActionState("");
    try {
      if (authSession?.accessToken) {
        await signOutSupabase(authSession.accessToken).catch(() => null);
      }
      if (cloudAutoSyncTimeoutRef.current) {
        clearTimeout(cloudAutoSyncTimeoutRef.current);
      }
      cloudRestoreAttemptedRef.current = false;
      cloudRestoreInProgressRef.current = false;
      cloudSyncInFlightRef.current = false;
      cloudAutoDecisionKeyRef.current = "";
      lastCloudSyncSnapshotRef.current = "";
      setAuthSession(null);
      setAuthUser(null);
      setCloudSyncPending(false);
      setLastLocalDataChangeAt("");
      setLastCloudSyncAt("");
      setCloudRemoteUpdatedAt("");
      setCloudSyncState("");
      setAccountActionState("Signed out.");
    } catch (error) {
      setAccountActionState(error?.message || "Unable to sign out.");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleUseCloudData = async () => {
    if (!authUser?.id) {
      setCloudSyncState("Sign in first.");
      return;
    }

    setAccountActionState("");
    await loadCloudDataToLocal({ overwriteLocal: true }).catch(() => null);
  };

  const handleKeepThisDeviceData = async () => {
    if (!authUser?.id) {
      setCloudSyncState("Sign in first.");
      return;
    }

    setAccountActionState("");
    await syncLocalDataToCloud({
      silent: false,
      source: "manual-conflict-resolve",
      snapshotOverride: currentCloudSyncSnapshotRef.current,
    }).catch(() => null);
  };

  const expediteCloudSync = ({ source = "user-action" } = {}) => {
    if (!storageHydrated || !authSession?.accessToken || !authUser?.id) {
      return;
    }

    if (cloudRestoreInProgressRef.current || cloudSyncInFlightRef.current) {
      return;
    }

    if (cloudSyncConflict.hasConflict) {
      setCloudSyncPending(true);
      setCloudSyncState("Local changes saved. Resolve the cloud conflict before backing up this device.");
      return;
    }

    if (cloudAutoSyncTimeoutRef.current) {
      clearTimeout(cloudAutoSyncTimeoutRef.current);
    }

    setCloudSyncPending(true);
    setCloudSyncState("Changes saved. Updating cloud backup...");
    cloudAutoSyncTimeoutRef.current = setTimeout(() => {
      syncLocalDataToCloud({
        silent: true,
        source: `expedite-${source}`,
      }).catch((error) => {
        console.log("[CLOUD EXPEDITE SYNC]", error?.message || error);
      });
    }, 450);
  };

  const syncLocalDataToCloud = async ({
    silent = false,
    source = "manual",
    snapshotOverride = "",
    accessTokenOverride = "",
    userIdOverride = "",
  } = {}) => {
    const effectiveAccessToken = accessTokenOverride || authSession?.accessToken || "";
    const effectiveUserId = userIdOverride || authUser?.id || "";

    if (!effectiveAccessToken || !effectiveUserId) {
      if (!silent) {
        setCloudSyncState("Sign in first.");
      }
      return false;
    }

    if (cloudRestoreInProgressRef.current || cloudSyncInFlightRef.current) {
      return false;
    }

    const snapshotValue = snapshotOverride || cloudSyncSnapshot;
    cloudSyncInFlightRef.current = true;
    if (cloudAutoSyncTimeoutRef.current) {
      clearTimeout(cloudAutoSyncTimeoutRef.current);
    }
    setAuthBusy(true);
    setCloudSyncState(silent ? "Auto-syncing latest changes..." : "Syncing local data...");
    try {
      const diaryRows = buildCloudDiaryRows(effectiveUserId, foodDiaryByDate);
      const checkInPayload = buildCloudCheckInPayload(effectiveUserId, checkIns);
      const workoutTemplatePayload = buildCloudWorkoutTemplatePayload(effectiveUserId, workoutTemplates);
      const trainingProgramPayload = buildCloudTrainingProgramPayload(effectiveUserId, trainingSplits, activeSplitId, workoutTemplates);
      const completedWorkoutPayload = buildCloudCompletedWorkoutPayload(effectiveUserId, completedWorkouts, workoutTemplates);

      await saveCloudProfile(effectiveAccessToken, buildCloudProfilePayload(effectiveUserId, userProfile));
      await replaceAllDiaryEntries(effectiveAccessToken, effectiveUserId, diaryRows);
      await replaceAllCheckIns(effectiveAccessToken, effectiveUserId, checkInPayload);
      await replaceAllWorkoutTemplates(effectiveAccessToken, effectiveUserId, workoutTemplatePayload);
      await replaceAllTrainingPrograms(effectiveAccessToken, effectiveUserId, trainingProgramPayload);
      await replaceAllCompletedWorkouts(effectiveAccessToken, effectiveUserId, completedWorkoutPayload);

      const syncedAt = new Date().toISOString();
      lastCloudSyncSnapshotRef.current = snapshotValue;
      cloudAutoDecisionKeyRef.current = "";
      setCloudSyncPending(false);
      setLastCloudSyncAt(syncedAt);
      setCloudRemoteUpdatedAt(syncedAt);
      setCloudSyncState(
        silent
          ? "Cloud backup updated automatically."
          : `Synced ${diaryRows.length} diary entries, ${checkInPayload.checkIns.length} check-ins, ${workoutTemplatePayload.templates.length} workouts, ${trainingProgramPayload.programs.length} programs, and ${completedWorkoutPayload.workouts.length} completed workouts.`
      );
      return true;
    } catch (error) {
      setCloudSyncPending(true);
      setCloudSyncState(error?.message || "Cloud sync failed.");
      return false;
    } finally {
      cloudSyncInFlightRef.current = false;
      setAuthBusy(false);
    }
  };

  const openCheckInScreen = () => {
    const todayCheckIn = checkIns.find((entry) => entry.dateKey === todayKey);
    setCheckInDraft(
      todayCheckIn
        ? {
            id: todayCheckIn.id,
            dateKey: todayCheckIn.dateKey,
            weightLbs: todayCheckIn.weightLbs ? String(todayCheckIn.weightLbs) : "",
            photos: todayCheckIn.photos || [],
            notes: todayCheckIn.notes || "",
          }
        : {
            id: "",
            dateKey: todayKey,
            weightLbs: "",
            photos: [],
            notes: "",
          }
    );
    setCheckInSaveState("");
    setCheckInVisible(true);
  };

  const closeCheckInScreen = () => {
    setCheckInVisible(false);
    setCheckInSaveState("");
  };

  const pickCheckInPhotos = async () => {
    try {
      const permissionResponse = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResponse.granted) {
        setCheckInSaveState("Photo permission needed");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.35,
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: 4,
        base64: true,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const nextPhotos = await Promise.all(result.assets.map(async (asset, index) => ({
        id: `${Date.now()}-photo-${index}`,
        uri: await persistPickedImage(asset, {
          folderName: "check-in-photos",
          filePrefix: `check-in-${checkInDraft.dateKey || todayKey}`,
          scopeId: authUser?.id || authUser?.email || "signed-out",
        }),
        type: "other",
        createdAt: new Date().toISOString(),
      })));

      setCheckInDraft((current) => ({
        ...current,
        photos: [...(current.photos || []), ...nextPhotos],
      }));
    } catch (error) {
      setCheckInSaveState("Photo upload failed");
      logAppError({
        source: "check-in-photo",
        action: "pick-photo",
        userMessage: "Check-in photo upload failed.",
        error,
        details: {
          userId: authUser?.id || "signed-out",
          dateKey: checkInDraft.dateKey || todayKey,
        },
      });
    }
  };

  const removeCheckInPhoto = (photoId) => {
    setCheckInDraft((current) => ({
      ...current,
      photos: (current.photos || []).filter((photo) => photo.id !== photoId),
    }));
  };

  const saveCheckIn = () => {
    const normalizedWeight = toNumber(checkInDraft.weightLbs);
    if (!normalizedWeight) {
      setCheckInSaveState("Enter bodyweight");
      return;
    }

    const normalizedEntry = normalizeCheckInEntry({
      id: checkInDraft.id || `check-in-${checkInDraft.dateKey}-${Date.now()}`,
      dateKey: checkInDraft.dateKey || todayKey,
      createdAt: new Date().toISOString(),
      weightLbs: normalizedWeight,
      photos: checkInDraft.photos || [],
      notes: checkInDraft.notes || "",
    });

    setCheckIns((current) => {
      const withoutSameDay = current.filter((entry) => entry.dateKey !== normalizedEntry.dateKey);
      return [normalizedEntry, ...withoutSameDay].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    });
    setCheckInSaveState("Saved");
    logAppInfo({
      source: "check-in",
      action: "save-check-in",
      userMessage: "Check-in saved.",
      details: {
        dateKey: normalizedEntry.dateKey,
        photoCount: normalizedEntry.photos?.length || 0,
      },
    });
    expediteCloudSync({ source: "check-in-save" });
  };

  const addProfileWeightEntry = () => {
    const normalizedWeight = toNumber(profileDraft.weightLbs);
    if (!normalizedWeight) {
      setProfileSaveState("Enter a bodyweight first");
      return;
    }
    const normalizedEntry = normalizeCheckInEntry({
      id: `profile-weight-${todayKey}-${Date.now()}`,
      dateKey: todayKey,
      createdAt: new Date().toISOString(),
      weightLbs: normalizedWeight,
      photos: [],
      notes: "Profile bodyweight update",
    });
    setCheckIns((current) => [normalizedEntry, ...current.filter((entry) => entry.dateKey !== todayKey)]);
    setUserProfile((current) => ({ ...current, weightLbs: String(normalizedWeight) }));
    setProfileSaveState("Weight added");
    expediteCloudSync({ source: "profile-weight-add" });
  };

  const renderSettingsHome = () => (
    <ScrollView style={styles.screenScroll} contentContainerStyle={styles.settingsContent} showsVerticalScrollIndicator={false}>
      <View style={styles.settingsHeroCard}>
        <Text style={styles.eyebrow}>Settings</Text>
        <Text style={styles.cardTitle}>Customize your app</Text>
        <Text style={styles.cardSubtle}>Manage profile details, tracking preferences, and future coaching behavior from one place.</Text>
      </View>

      <View style={styles.settingsOptionStack}>
        {settingsOptions.filter((option) => !["account", "personal-info"].includes(option.id)).map((option) => (
          <Pressable key={option.id} onPress={() => handleSettingsOptionPress(option)} style={styles.settingsOptionCard}>
            <View style={styles.settingsOptionBadge}>
              <Text style={styles.settingsOptionBadgeText}>{option.badge}</Text>
            </View>
            <View style={styles.settingsOptionCopy}>
              <Text style={styles.settingsOptionTitle}>{option.title}</Text>
              <Text style={styles.settingsOptionSubtitle}>{option.subtitle}</Text>
            </View>
            <TriangleArrowIcon size={15} color={theme.textMuted} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );

  const renderSettingsPlaceholder = () => (
    <View style={styles.settingsPlaceholderCard}>
      <Text style={styles.eyebrow}>Coming Soon</Text>
      <Text style={styles.cardTitle}>{settingsPlaceholder?.title || "Settings"}</Text>
      <Text style={styles.cardSubtle}>{settingsPlaceholder?.message || "This settings area will be filled in later."}</Text>
    </View>
  );

  const renderPersonalInfoScreen = () => (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView style={styles.screenScroll} contentContainerStyle={styles.settingsContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.settingsHeroCard}>
          <Text style={styles.eyebrow}>Profile</Text>
          <Text style={styles.cardTitle}>Personal Info</Text>
          <Text style={styles.cardSubtle}>Save the basics now so food, bodyweight, and coaching settings can personalize later.</Text>
        </View>

        <View style={styles.profileFormCard}>
          <View style={styles.profileField}>
            <Text style={styles.selectionLabel}>Profile Photo</Text>
            <Pressable onPress={pickProfilePhoto} style={({ pressed }) => [styles.profilePhotoPicker, pressed && styles.darkPressablePressed]}>
              {profileDraft.profilePhotoUri ? (
                <Image source={{ uri: profileDraft.profilePhotoUri }} style={styles.profilePhotoPickerImage} />
              ) : (
                <View style={styles.profilePhotoPickerAvatar}>
                  <ProfileHeadIcon size={24} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.profilePhotoPickerTitle}>{profileDraft.profilePhotoUri ? "Change Profile Photo" : "Add Profile Photo"}</Text>
                <Text style={styles.profilePhotoPickerSubtitle}>Choose a square image from your library.</Text>
              </View>
              <PencilIcon size={18} />
            </Pressable>
          </View>

          <View style={styles.profileField}>
            <Text style={styles.selectionLabel}>First Name</Text>
            <TextInput
              value={profileDraft.firstName}
              onChangeText={(value) => setProfileDraft((current) => ({ ...current, firstName: value }))}
              placeholder="First name"
              placeholderTextColor="#6f817b"
              style={styles.searchInput}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.profileField}>
            <Text style={styles.selectionLabel}>Height</Text>
            <View style={styles.heightCounterRow}>
              {[
                { key: "feet", label: "Feet", value: profileHeightParts.feet },
                { key: "inches", label: "Inches", value: profileHeightParts.inches },
              ].map((counter) => (
                <View key={counter.key} style={styles.heightCounterCard}>
                  <Pressable
                    onPress={() => updateProfileHeightPart(counter.key, 1)}
                    style={({ pressed }) => [styles.heightCounterButton, pressed && styles.darkPressablePressed]}
                  >
                    <Text style={styles.heightCounterButtonText}>{"^"}</Text>
                  </Pressable>
                  <Text style={styles.heightCounterValue}>{counter.value}</Text>
                  <Text style={styles.heightCounterLabel}>{counter.label}</Text>
                  <Pressable
                    onPress={() => updateProfileHeightPart(counter.key, -1)}
                    style={({ pressed }) => [styles.heightCounterButton, pressed && styles.darkPressablePressed]}
                  >
                    <Text style={styles.heightCounterButtonText}>{"v"}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
            <Text style={styles.heightCounterSummary}>{formatHeightParts(profileHeightParts.feet, profileHeightParts.inches)}</Text>
          </View>

          <View style={styles.profileField}>
            <Text style={styles.selectionLabel}>Sex</Text>
            <View style={styles.profileSexRow}>
              {[
                { key: "male", label: "Male" },
                { key: "female", label: "Female" },
                { key: "other", label: "Other" },
                { key: "prefer_not_to_say", label: "Prefer not to say" },
              ].map((option) => (
                <Pressable
                  key={option.key}
                  onPress={() => setProfileDraft((current) => ({ ...current, sex: option.key }))}
                  style={[styles.profileSexChip, profileDraft.sex === option.key && styles.profileSexChipActive]}
                >
                  <Text style={[styles.profileSexChipText, profileDraft.sex === option.key && styles.profileSexChipTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {profileSaveState ? <Text style={styles.profileSaveState}>{profileSaveState}</Text> : null}

          <Pressable onPress={saveProfile} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Save</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderProfileScreen = () => {
    const recentWorkouts = completedWorkouts.slice(0, 4);
    const latestWeight = checkIns[0]?.weightLbs || userProfile.weightLbs || "";
    const completedWorkoutCount = completedWorkouts.filter((workout) => !isPlaceholderCompletedWorkout(workout)).length;
    return (
      <ScrollView style={styles.screenScroll} contentContainerStyle={styles.settingsContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.profileHeroCard}>
          <View style={styles.profileAvatar}>
            {userProfile.profilePhotoUri ? (
              <Image source={{ uri: userProfile.profilePhotoUri }} style={styles.profileAvatarImage} />
            ) : (
              <Text style={styles.profileAvatarText}>{(userProfile.firstName || authUser?.email || "D").slice(0, 1).toUpperCase()}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Profile</Text>
            <Text style={styles.cardTitle}>{userProfile.firstName || "DualFit Athlete"}</Text>
            <Text style={styles.cardSubtle}>{authUser?.email || "Signed-out profile"}</Text>
          </View>
          <Pressable onPress={openPersonalInfoFromProfile} style={({ pressed }) => [styles.profileHeaderEditButton, pressed && styles.darkPressablePressed]}>
            <PencilIcon size={20} />
          </Pressable>
        </View>

        <View style={styles.profileMetricGrid}>
          <View style={[styles.summaryMetricCard, styles.profileMetricCard]}>
            <Text style={styles.summaryMetricLabel}>Bodyweight</Text>
            <Text style={styles.summaryMetricValue}>{latestWeight ? `${latestWeight} lb` : "Add"}</Text>
          </View>
          <View style={[styles.summaryMetricCard, styles.profileMetricCard]}>
            <Text style={styles.summaryMetricLabel}>Completed Workouts</Text>
            <Text style={styles.summaryMetricValue}>{completedWorkoutCount}</Text>
          </View>
        </View>

        <View style={styles.profileFormCard}>
          <Text style={styles.eyebrow}>Account</Text>
          <Text style={styles.cardSubtle}>Manage sign-in and backup settings for your DualFit account.</Text>
          <Pressable onPress={openAccountFromProfile} style={({ pressed }) => [styles.secondaryButtonWide, pressed && styles.darkPressablePressed]}>
            <Text style={styles.secondaryButtonText}>Account Settings</Text>
          </Pressable>
          {profileSaveState ? <Text style={styles.profileSaveState}>{profileSaveState}</Text> : null}
        </View>

        <View style={styles.profileFormCard}>
          <Text style={styles.eyebrow}>Recent Workouts</Text>
          {recentWorkouts.length ? renderCompletedWorkoutCards(recentWorkouts) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No workout history yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderProgress = () => {
    const hasFoodToday = todayDiaryEntries.length > 0;
    const todaysScheduledDay = todaysProgramSchedule?.scheduledDay || null;
    const todaysTemplate = todaysProgramSchedule?.template || null;
    const todayHeroTitle = todaysScheduledDay?.isRestDay
      ? "Rest Day"
      : todaysTemplate?.name || todaysScheduledDay?.label || "No Workout Scheduled";
    const todayHeroSubtitle = todaysScheduledDay?.isRestDay
      ? (nextProgramSchedule?.template?.name
        ? `Recover today. Next up ${formatDateCaption(nextProgramSchedule.dateKey)}: ${nextProgramSchedule.template.name}.`
        : "Recovery, mobility, and nutrition will keep the week moving.")
      : todaysTemplate
        ? formatMuscleGroupsInline(
          todaysWorkoutMuscleGroups,
          todaysTemplate.description || "Your scheduled session is ready to go."
        )
        : "No workout scheduled yet. Open your program or start by logging meals.";
    const myProgramSubtitle = todaysTemplate
      ? `Today's split: ${activeSplit?.name || "Program"}`
      : nextProgramSchedule?.template
        ? `Next training day ${formatDateCaption(nextProgramSchedule.dateKey)} - ${nextProgramSchedule.template.name}`
        : activeSplit?.name
          ? `${activeSplit.name} is active. Open it to set up the week.`
          : "No active split selected yet.";
    const recentActivityRows = [
      latestCompletedWorkout
        ? {
          id: "workout",
          label: "Last workout",
          value: latestCompletedWorkout.name,
          meta: formatDateCaption(latestCompletedWorkout.dateKey),
          onPress: () => openHistoryWorkoutDetails(latestCompletedWorkout),
        }
        : null,
      latestCheckInEntry
        ? {
          id: "checkin",
          label: "Last check-in",
          value: `${formatCompactNumber(weightUnitPreference === "kg" ? latestCheckInEntry.weightLbs * 0.45359237 : latestCheckInEntry.weightLbs, 1)} ${weightUnitPreference}`,
          meta: formatDateCaption(latestCheckInEntry.dateKey),
          onPress: openCheckInScreen,
        }
        : null,
      {
        id: "nutrition",
        label: "Today's nutrition",
        value: hasFoodToday ? `${formatCompactNumber(todayDiaryTotals.calories, 0)} kcal logged` : "No meals logged yet",
        meta: hasFoodToday ? `${todayDiaryEntries.length} entries today` : "Tap to log food",
        onPress: openDiaryTab,
      },
    ].filter(Boolean);

    return (
      <View style={styles.dashboardScreen}>
        <View style={[styles.dashboardStickyHeader, { paddingTop: Math.max(insets.top + 2, 14), paddingHorizontal: 12 + Math.max(insets.left, insets.right) * 0.15 }]}>
          <View style={styles.dashboardHeaderRow}>
            <Pressable
              onPress={openProfileScreen}
              style={({ pressed }) => [
                styles.dashboardHeaderIconButton,
                pressed && styles.darkPressablePressed,
              ]}
            >
              <ProfileHeadIcon size={20} />
            </Pressable>
            <Text style={styles.dashboardHeaderTitle}>DUALFIT</Text>
            <Pressable
              onPress={openSettingsScreen}
              style={({ pressed }) => [
                styles.dashboardHeaderIconButton,
                pressed && styles.darkPressablePressed,
              ]}
            >
              <GearIcon size={20} />
            </Pressable>
          </View>
        </View>
        <ScrollView
          style={styles.screenScroll}
          contentContainerStyle={styles.dashboardScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dashboardTodayCard}>
            <Text style={styles.dashboardTodayEyebrow}>Today</Text>
            <Text style={styles.dashboardTodayTitle}>{todayHeroTitle}</Text>
            <Text style={styles.dashboardTodaySubtitle}>{todayHeroSubtitle}</Text>
            <View style={styles.dashboardTodayActionRow}>
              {todaysTemplate && !todaysScheduledDay?.isRestDay ? (
                <Pressable onPress={() => startSavedWorkout(todaysTemplate)} style={({ pressed }) => [styles.dashboardPrimaryActionButton, pressed && styles.primaryButtonPressed]}>
                  <Text style={styles.dashboardPrimaryActionText}>Start Workout</Text>
                </Pressable>
              ) : (
                <Pressable onPress={openProgramScreen} style={({ pressed }) => [styles.dashboardPrimaryActionButton, pressed && styles.primaryButtonPressed]}>
                  <Text style={styles.dashboardPrimaryActionText}>View Program</Text>
                </Pressable>
              )}
              {!hasFoodToday ? (
                <Pressable onPress={openDiaryTab} style={({ pressed }) => [styles.dashboardSecondaryActionButton, pressed && styles.darkPressablePressed]}>
                  <Text style={styles.dashboardSecondaryActionText}>Log Food</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <Pressable onPress={() => setProgressStatsVisible(true)} style={({ pressed }) => [styles.progressOverviewCard, pressed && styles.darkPressablePressed]}>
            <View style={styles.progressOverviewTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.progressOverviewEyebrow}>Insights</Text>
                <Text style={styles.progressOverviewTitle}>Progress & Statistics</Text>
                <Text style={styles.progressOverviewSubtitle}>View trends for nutrition, training, sleep, and bodyweight.</Text>
              </View>
              <View style={styles.progressOverviewArrowButton}>
                <TriangleArrowIcon size={15} color={theme.accent} />
              </View>
            </View>
            <View style={styles.progressOverviewChipRow}>
              {["Nutrition", "Training", "Bodyweight"].map((chip) => (
                <View key={chip} style={styles.progressOverviewChip}>
                  <Text style={styles.progressOverviewChipText}>{chip}</Text>
                </View>
              ))}
            </View>
          </Pressable>

          <Pressable onPress={openProgramScreen} style={({ pressed }) => [styles.dashboardProgramCard, pressed && styles.darkPressablePressed]}>
            <View style={styles.dashboardProgramHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>My Program</Text>
                <Text style={styles.dashboardProgramTitle}>{activeSplit?.name || "Program not set"}</Text>
                <Text style={styles.dashboardProgramSubtitle}>{myProgramSubtitle}</Text>
              </View>
              <View style={styles.dashboardProgramArrowButton}>
                <TriangleArrowIcon size={15} color={theme.accent} />
              </View>
            </View>
          </Pressable>

          {recentActivityRows.length ? (
            <View style={styles.dashboardRecentCard}>
              <Text style={styles.eyebrow}>Recent Activity</Text>
              {recentActivityRows.map((item) => (
                <Pressable key={item.id} onPress={item.onPress} style={({ pressed }) => [styles.dashboardRecentRow, pressed && styles.darkPressablePressed]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dashboardRecentLabel}>{item.label}</Text>
                    <Text style={styles.dashboardRecentValue}>{item.value}</Text>
                  </View>
                  <Text style={styles.dashboardRecentMeta}>{item.meta}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={styles.dashboardChartsSection}>
            <View style={styles.dashboardSectionHeaderRow}>
              <View>
                <Text style={styles.eyebrow}>Trends</Text>
                <Text style={styles.dashboardSectionTitle}>Performance at a glance</Text>
              </View>
            </View>
            <View style={styles.dashboardHero}>
              <Animated.ScrollView
                horizontal
                pagingEnabled
                decelerationRate="fast"
                snapToInterval={dashboardCardWidth + 12}
                snapToAlignment="start"
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dashboardCarouselContent}
                scrollEventThrottle={16}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: dashboardScrollX } } }],
                  { useNativeDriver: true }
                )}
                onMomentumScrollEnd={(event) => {
                  const nextIndex = Math.round(event.nativeEvent.contentOffset.x / (dashboardCardWidth + 12));
                  setDashboardCarouselIndex(Math.max(0, Math.min(nextIndex, dashboardMetrics.length - 1)));
                }}
              >
                {visibleDashboardMetrics.map((metric, index) => (
                  <View key={metric.id} style={{ marginRight: index === visibleDashboardMetrics.length - 1 ? 0 : 12 }}>
                    <DashboardMetricCard
                      metric={metric}
                      width={dashboardCardWidth}
                      onCycleRange={() => cycleDashboardRange(metric.id)}
                    />
                  </View>
                ))}
              </Animated.ScrollView>

              <View style={styles.dashboardDots}>
                {dashboardMetricConfigs.map((metric, index) => (
                  <Animated.View
                    key={`${metric.id}-dot`}
                    style={[
                      styles.dashboardDot,
                      {
                        opacity: dashboardScrollX.interpolate({
                          inputRange: [
                            (index - 1) * (dashboardCardWidth + 12),
                            index * (dashboardCardWidth + 12),
                            (index + 1) * (dashboardCardWidth + 12),
                          ],
                          outputRange: [0.28, 1, 0.28],
                          extrapolate: "clamp",
                        }),
                        transform: [
                          {
                            scale: dashboardScrollX.interpolate({
                              inputRange: [
                                (index - 1) * (dashboardCardWidth + 12),
                                index * (dashboardCardWidth + 12),
                                (index + 1) * (dashboardCardWidth + 12),
                              ],
                              outputRange: [1, 1.75, 1],
                              extrapolate: "clamp",
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderAccountScreen = () => (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView style={styles.screenScroll} contentContainerStyle={styles.settingsContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.settingsHeroCard}>
          <Text style={styles.eyebrow}>Account</Text>
          <Text style={styles.cardTitle}>Sign in & cloud backup</Text>
          <Text style={styles.cardSubtle}>
            Create an account or sign in to start backing up your DualFit data. This Phase 1 sync currently covers profile, diary entries, check-ins, workout templates, programs, and completed workout history.
          </Text>
        </View>

        <View style={styles.profileFormCard}>
          <View style={styles.profileField}>
            <Text style={styles.selectionLabel}>Email</Text>
            <TextInput
              value={accountDraft.email}
              onChangeText={(value) => setAccountDraft((current) => ({ ...current, email: value }))}
              placeholder="you@example.com"
              placeholderTextColor="#6f817b"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.searchInput}
            />
          </View>

          <View style={styles.profileField}>
            <Text style={styles.selectionLabel}>Password</Text>
            <TextInput
              value={accountDraft.password}
              onChangeText={(value) => setAccountDraft((current) => ({ ...current, password: value }))}
              placeholder="Password"
              placeholderTextColor="#6f817b"
              secureTextEntry
              style={styles.searchInput}
            />
          </View>

          <View style={styles.settingsPlaceholderCard}>
            <Text style={styles.selectionLabel}>Status</Text>
            <Text style={styles.cardSubtle}>
              {authUser?.email
                ? `Signed in as ${authUser.email}`
                : "Not signed in yet."}
            </Text>
            <Text style={styles.cardSubtle}>
              {authUser?.email ? "Your data will stay connected to this account automatically." : "Create an account or sign in to keep your data backed up."}
            </Text>
            {accountActionState ? <Text style={styles.profileSaveState}>{accountActionState}</Text> : null}
          </View>

          <View style={styles.modalButtonRow}>
            <Pressable
              onPress={handleAccountSignUp}
              disabled={authBusy}
              style={({ pressed }) => [styles.secondaryButton, authBusy && styles.secondaryButtonDisabled, pressed && styles.darkPressablePressed]}
            >
              <Text style={styles.secondaryButtonText}>Create Account</Text>
            </Pressable>
            <Pressable
              onPress={handleAccountSignIn}
              disabled={authBusy}
              style={({ pressed }) => [styles.primaryButton, authBusy && styles.primaryButtonDisabled, pressed && styles.primaryButtonPressed]}
            >
              <Text style={styles.primaryButtonText}>Sign In</Text>
            </Pressable>
          </View>

          {authUser?.id ? (
            <Pressable
              onPress={handleAccountSignOut}
              disabled={authBusy}
              style={({ pressed }) => [styles.secondaryButton, authBusy && styles.secondaryButtonDisabled, pressed && styles.darkPressablePressed]}
            >
              <Text style={styles.secondaryButtonText}>Sign Out</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderProgramHome = () => {
    const selectedDateLabel = getRelativeDayLabel(programSelectedDateKey);
    const selectedWorkoutTemplate = selectedProgramSchedule?.template || null;
    const selectedScheduledDay = selectedProgramSchedule?.scheduledDay || null;
    const isViewingToday = programSelectedDateKey === todayKey;
    const selectedDate = parseDateKey(programSelectedDateKey);
    const todayDate = parseDateKey(todayKey);
    const isPastSelectedDate = selectedDate.getTime() < todayDate.getTime();
    const hasCompletedSelectedWorkout = isPastSelectedDate && selectedProgramHistoryWorkouts.length > 0;
    const showMissingLoggedWorkout = isPastSelectedDate && !hasCompletedSelectedWorkout && selectedScheduledDay && !selectedScheduledDay.isRestDay;
    const activeTrainingDays = activeSplit?.scheduledDays?.filter((day) => !day.isRestDay).length || 0;
    const splitSummary = activeSplit
      ? `${activeTrainingDays}-day split - ${activeSplit.restDays} rest day${activeSplit.restDays === 1 ? "" : "s"}`
      : "No split selected";
    const currentMonthTitle = programCalendarMonthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    const currentWeekRange = `${programWeekDates[0]?.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${programWeekDates[6]?.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
    const workoutCardEyebrow = hasCompletedSelectedWorkout
      ? "Completed Workout"
      : isViewingToday
        ? "Today's Workout"
        : "Selected Workout";

    return (
      <>
        <ScrollView style={styles.screenScroll} contentContainerStyle={styles.settingsContent} showsVerticalScrollIndicator={false}>
          <View style={styles.programSectionCard}>
            <View style={styles.programSectionHeaderRow}>
              <View>
                <Text style={styles.eyebrow}>Weekly Calendar</Text>
                <Text style={styles.programSectionSubtitle}>{currentWeekRange}</Text>
              </View>
              <View style={styles.programWeekArrowRow}>
                <Pressable onPress={openProgramCalendar} style={({ pressed }) => [styles.programArrowButton, pressed && styles.darkPressablePressed]}>
                  <CalendarIcon size={21} color={theme.textSubtle} />
                </Pressable>
                <Pressable onPress={() => setProgramWeekStartKey((current) => shiftDateKey(current, -7))} style={({ pressed }) => [styles.programArrowButton, pressed && styles.darkPressablePressed]}>
                  <TriangleArrowIcon direction="left" size={18} color={theme.text} />
                </Pressable>
                <Pressable onPress={() => setProgramWeekStartKey((current) => shiftDateKey(current, 7))} style={({ pressed }) => [styles.programArrowButton, pressed && styles.darkPressablePressed]}>
                  <TriangleArrowIcon size={18} color={theme.text} />
                </Pressable>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.programWeekCardRow}>
              {programWeekDates.map((date, index) => {
                const dateKey = getDateKey(date);
                const scheduledDay = getScheduledDayForDate(activeSplit, date) || null;
                const isToday = dateKey === todayKey;
                const isSelected = dateKey === programSelectedDateKey;
                const isCompleted = completedWorkouts.some((workout) => workout.dateKey === dateKey);

                return (
                  <View key={dateKey} style={styles.programDayCellWrap}>
                    {isToday ? (
                      <View style={styles.programTodayPillFloating}>
                        <Text style={styles.programTodayPillText}>Today</Text>
                      </View>
                    ) : (
                      <View style={styles.programTodayPillSpacer} />
                    )}
                    <Pressable
                      onPress={() => selectProgramDate(dateKey)}
                      style={({ pressed }) => [
                        styles.programDayCard,
                        isToday && styles.programDayCardToday,
                        isSelected && styles.programDayCardSelected,
                        isToday && isSelected && styles.programDayCardTodaySelected,
                        pressed && styles.darkPressablePressed,
                      ]}
                    >
                      <View style={styles.programDayTopRow}>
                        <Text
                          style={[
                            styles.programDayLabel,
                            isToday && styles.programDayLabelToday,
                            isSelected && styles.programDayLabelSelected,
                          ]}
                        >
                          {weekDayLabels[index]}
                        </Text>
                      </View>
                      <Text style={[styles.programDayNumber, isSelected && styles.programDayNumberSelected]}>{date.getDate()}</Text>
                      <View style={styles.programDayStatusDotSlot}>
                        <View style={[styles.programDayStatusDotWrap, isSelected && styles.programDayStatusDotWrapSelected]}>
                          {isCompleted ? (
                            <CheckMarkIcon size={14} color={isSelected ? "#ffffff" : theme.accent} />
                          ) : scheduledDay && !scheduledDay.isRestDay ? (
                            <DotIcon size={18} color={theme.accent} />
                          ) : (
                            <DotIcon size={18} color="#ffffff" />
                          )}
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.programDayWorkoutLabel,
                          isSelected && styles.programDayWorkoutLabelSelected,
                          isToday && styles.programDayWorkoutLabelToday,
                        ]}
                      >
                        {scheduledDay?.label || "Rest"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.programWeekSummaryCard}>
              <View style={styles.programWeekSummaryRing}>
                <Text style={styles.programWeekSummaryRingText}>{programWeekStats.completed}/{Math.max(programWeekStats.total, 1)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.programWeekSummaryTitle}>This Week</Text>
                <Text style={styles.programWeekSummaryBody}>{programWeekStats.completed} of {programWeekStats.total} sessions completed</Text>
              </View>
              <Text style={styles.programWeekSummaryPercent}>{programWeekStats.percent}%</Text>
            </View>
          </View>

          <View style={styles.programSectionCard}>
            <Text style={styles.eyebrow}>{workoutCardEyebrow}</Text>
            <Text style={styles.programWorkoutTitle}>
              {hasCompletedSelectedWorkout
                ? selectedProgramHistoryWorkouts[0]?.name || "Completed Workout"
                : selectedScheduledDay?.isRestDay
                  ? "Rest Day"
                  : selectedWorkoutTemplate?.name || selectedScheduledDay?.label || "Workout"}
            </Text>
            <Text style={styles.programWorkoutSubtitle}>
              {hasCompletedSelectedWorkout
                ? `${selectedDateLabel} - Tap a logged session to review the exact sets`
                : selectedScheduledDay?.isRestDay
                  ? `${selectedDateLabel} - Recovery, mobility, and nutrition focus`
                  : selectedWorkoutTemplate?.description || "Structured hypertrophy session"}
            </Text>

            {hasCompletedSelectedWorkout ? (
              <View style={styles.programHistoryBlock}>{renderCompletedWorkoutCards(selectedProgramHistoryWorkouts)}</View>
            ) : selectedScheduledDay?.isRestDay ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No programmed lifting for this day. Use it to recover and come back fresh.</Text>
              </View>
            ) : showMissingLoggedWorkout ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>This day had a scheduled session, but no completed workout was logged yet.</Text>
              </View>
            ) : selectedWorkoutTemplate ? (
              <>
                {(() => {
                  const exerciseCount = selectedWorkoutTemplate.exercises?.length || 0;
                  const totalSets = (selectedWorkoutTemplate.exercises || []).reduce(
                    (sum, exercise) => sum + Math.max(Number(exercise.defaultSets) || 0, 0),
                    0
                  );
                  const estimatedMinutes = Math.max(totalSets * 3, exerciseCount ? 15 : 0);
                  return (
                <View style={styles.programWorkoutMetaGrid}>
                  <View style={styles.programMetaCard}>
                    <Text style={styles.programMetaValue}>{exerciseCount}</Text>
                    <Text style={styles.programMetaLabel}>Exercises</Text>
                  </View>
                  <View style={styles.programMetaCard}>
                    <Text style={styles.programMetaValue}>{totalSets}</Text>
                    <Text style={styles.programMetaLabel}>Sets</Text>
                  </View>
                  <View style={styles.programMetaCard}>
                    <Text style={styles.programMetaValue}>~{estimatedMinutes}</Text>
                    <Text style={styles.programMetaLabel}>Estimated Duration</Text>
                  </View>
                </View>
                  );
                })()}

                {renderWorkoutExerciseList(
                  selectedWorkoutTemplate.exercises || [],
                  programExercisesExpanded,
                  () => setProgramExercisesExpanded((current) => !current),
                  "No exercises programmed yet.",
                  `${selectedWorkoutTemplate.exercises?.length || 0} Exercises`
                )}

                <Pressable onPress={() => startScheduledWorkout(selectedWorkoutTemplate)} style={({ pressed }) => [styles.programStartButton, pressed && styles.primaryButtonPressed]}>
                  <Text style={styles.programStartButtonText}>{isPastSelectedDate ? "Open Workout" : "Start Workout"}</Text>
                  <TriangleArrowIcon size={16} color={theme.accentTextDark} />
                </Pressable>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No workout is scheduled for this date.</Text>
              </View>
            )}
          </View>

          <View style={styles.programSectionCard}>
            <View style={styles.programSectionHeaderRow}>
              <View>
                <Text style={styles.eyebrow}>Current Split</Text>
                <Text style={styles.cardTitle}>{activeSplit?.name || "No active split"}</Text>
                <Text style={styles.cardSubtle}>{splitSummary}</Text>
              </View>
              <Pressable onPress={openSplitEditor} style={({ pressed }) => [styles.programEditButton, pressed && styles.darkPressablePressed]}>
                <Text style={styles.programEditButtonText}>Edit</Text>
                <TriangleArrowIcon size={15} color={theme.accent} />
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <Modal visible={programCalendarVisible} transparent animationType="fade" onRequestClose={() => setProgramCalendarVisible(false)}>
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setProgramCalendarVisible(false)} />
            <View style={styles.programCalendarModal}>
              <View style={styles.programCalendarHeader}>
                <Pressable onPress={() => setProgramCalendarMonthKey(getDateKey(shiftMonth(programCalendarMonthDate, -1)))} style={styles.programArrowButton}>
                  <TriangleArrowIcon direction="left" size={18} color={theme.text} />
                </Pressable>
                <Text style={styles.programCalendarTitle}>{currentMonthTitle}</Text>
                <Pressable onPress={() => setProgramCalendarMonthKey(getDateKey(shiftMonth(programCalendarMonthDate, 1)))} style={styles.programArrowButton}>
                  <TriangleArrowIcon size={18} color={theme.text} />
                </Pressable>
              </View>

              <View style={styles.programCalendarWeekdayRow}>
                {weekDayLabels.map((label) => (
                  <Text key={label} style={styles.programCalendarWeekday}>{label.slice(0, 2)}</Text>
                ))}
              </View>

              <View style={styles.programCalendarGrid}>
                {programCalendarDates.map((date) => {
                  const dateKey = getDateKey(date);
                  const isInMonth = date.getMonth() === programCalendarMonthDate.getMonth();
                  const isToday = dateKey === todayKey;
                  const isSelected = dateKey === programSelectedDateKey;

                  return (
                    <Pressable
                      key={dateKey}
                      onPress={() => {
                        selectProgramDate(dateKey);
                        setProgramCalendarVisible(false);
                      }}
                      style={[
                        styles.programCalendarDayButton,
                        !isInMonth && styles.programCalendarDayButtonMuted,
                        isToday && styles.programCalendarDayButtonToday,
                        isSelected && styles.programCalendarDayButtonSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.programCalendarDayText,
                          !isInMonth && styles.programCalendarDayTextMuted,
                          isToday && styles.programCalendarDayTextToday,
                          isSelected && styles.programCalendarDayTextSelected,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>
      </>
    );
  };
  const renderProgramEdit = () => (
    <ScrollView style={styles.screenScroll} contentContainerStyle={styles.settingsContent} showsVerticalScrollIndicator={false}>
      <View style={styles.profileFormCard}>
        <Text style={styles.selectionLabel}>Training Splits</Text>
        <View style={styles.programSplitRowWithAction}>
          <View style={styles.programSplitDropdownWrap}>
            <Pressable
              onPress={() => setSplitSelectorExpanded((current) => !current)}
              style={({ pressed }) => [styles.programSplitDropdownButton, pressed && styles.darkPressablePressed]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.programSplitDropdownLabel}>Selected Split</Text>
                <Text style={styles.programSplitDropdownValue}>
                  {splitEditorDraft ? getSplitDisplayName(splitEditorDraft) : "Choose a split"}
                </Text>
              </View>
              <TriangleArrowIcon direction={splitSelectorExpanded ? "up" : "down"} size={18} color={theme.textSubtle} />
            </Pressable>
            {splitSelectorExpanded ? (
              <View style={styles.programSplitDropdownMenu}>
                {trainingSplits.map((split) => (
                  <Pressable
                    key={split.id}
                    onPress={() => {
                      loadSplitIntoEditor(split);
                      setSplitSelectorExpanded(false);
                    }}
                    style={({ pressed }) => [
                      styles.programSplitDropdownOption,
                      splitEditorDraft?.id === split.id && styles.programSplitDropdownOptionActive,
                      pressed && styles.darkPressablePressed,
                    ]}
                  >
                    <Text style={[styles.programSplitDropdownOptionText, splitEditorDraft?.id === split.id && styles.programSplitDropdownOptionTextActive]}>
                      {getSplitDisplayName(split)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
          <Pressable onPress={() => setSplitManagementMenuVisible((current) => !current)} style={({ pressed }) => [styles.programAddSplitButton, pressed && styles.scalePressSmall]}>
            <Image source={threeDotsMenuIcon} style={styles.templateMenuButtonIcon} resizeMode="contain" />
          </Pressable>
          <Pressable onPress={openCustomSplitScreen} style={({ pressed }) => [styles.programAddSplitButton, pressed && styles.scalePressSmall]}>
            <Text style={styles.programAddSplitButtonText}>+</Text>
          </Pressable>
        </View>
        {splitManagementMenuVisible ? (
          <View style={styles.splitManagementMenuCard}>
            <Pressable onPress={editSelectedSplit} style={styles.templateMenuAction}>
              <Text style={styles.templateMenuActionText}>Edit selected split</Text>
            </Pressable>
            <Pressable onPress={deleteSelectedSplit} style={styles.templateMenuAction}>
              <Image source={trashActionIcon} style={styles.templateMenuDeleteIcon} resizeMode="contain" />
              <Text style={[styles.templateMenuActionText, styles.templateMenuDeleteText]}>Delete selected split</Text>
            </Pressable>
            <Pressable onPress={restoreDefaultSplits} style={styles.templateMenuAction}>
              <Text style={styles.templateMenuActionText}>Restore default splits</Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={styles.selectionLabel}>Weekly Schedule Preview</Text>
        <Text style={styles.programPreviewHint}>Tap a day to change its training assignment.</Text>
        <ProgramSchedulePreviewGrid
          scheduledDays={splitEditorDraft?.scheduledDays || []}
          workoutTemplates={workoutTemplates}
          onChange={(nextScheduledDays) => setSplitEditorDraft((current) => current ? ({
            ...current,
            scheduledDays: nextScheduledDays,
            isManuallyEdited: true,
          }) : current)}
          onOpenMenu={openSplitCellMenu}
        />
        {false && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.programPreviewHorizontalRow}>
          {(splitEditorDraft?.scheduledDays || []).map((day, index) => (
            <View key={day.id} style={[styles.programPreviewBlock, day.isRestDay && styles.programPreviewBlockRest]}>
              <Text style={styles.programPreviewBlockOrder}>Day {index + 1}</Text>
              <Text style={styles.programPreviewBlockLabel}>{day.label}</Text>
              <Text style={styles.programPreviewBlockMeta}>
                {day.isRestDay
                  ? "Rest"
                  : (workoutTemplates.find((template) => template.id === day.workoutTemplateId)?.name || "Template")}
              </Text>
              <Text style={styles.programPreviewGrip}>...</Text>
              <View style={styles.programReorderRow}>
                <Pressable onPress={() => moveSplitDraftDay(index, -1)} style={styles.programMiniArrow}>
                  <TriangleArrowIcon direction="left" size={14} color={theme.textSubtle} />
                </Pressable>
                <Pressable onPress={() => moveSplitDraftDay(index, 1)} style={styles.programMiniArrow}>
                  <TriangleArrowIcon size={14} color={theme.textSubtle} />
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
        )}

        {programSaveState ? <Text style={styles.profileSaveState}>{programSaveState}</Text> : null}

        <Pressable onPress={saveSplitDraft} style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
          <Text style={styles.primaryButtonText}>Save Active Split</Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  const renderCustomSplit = () => {
    const customSplitDays = customSplitDraft?.scheduledDays || [];
    const actionDay = customSplitDays.find((day) => day.id === customSplitActionDayId) || null;
    const savedWorkoutTargetDay = customSplitDays.find((day) => day.id === customSplitWorkoutPickerDayId) || null;

    return (
      <>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView style={styles.screenScroll} contentContainerStyle={[styles.settingsContent, styles.customSplitContent]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.profileFormCard}>
              <Text style={styles.selectionLabel}>Split Name</Text>
              <TextInput
                value={customSplitDraft?.name || ""}
                onChangeText={(value) => setCustomSplitDraft((current) => current ? { ...current, name: value } : current)}
                placeholder="Custom Split"
                placeholderTextColor="#6f817b"
                style={styles.searchInput}
              />

              <View style={styles.customSplitSectionHeader}>
                <Text style={styles.selectionLabel}>Split Length</Text>
              </View>
              <View style={styles.customSplitLengthSelectorRow}>
                {[1, 2].map((weeks) => {
                  const selected = (customSplitDraft?.lengthWeeks || 1) === weeks;
                  return (
                    <Pressable
                      key={`split-length-${weeks}`}
                      onPress={() => setCustomSplitLengthWeeks(weeks)}
                      style={({ pressed }) => [
                        styles.customSplitLengthPill,
                        selected && styles.customSplitLengthPillActive,
                        pressed && styles.scalePressSmall,
                      ]}
                    >
                      <Text style={[styles.customSplitLengthPillText, selected && styles.customSplitLengthPillTextActive]}>
                        {weeks}-week split
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.customSplitSectionHeader}>
                <Text style={styles.selectionLabel}>Day Customization</Text>
                <Text style={styles.customSplitSectionMeta}>{customSplitDays.length} days</Text>
              </View>
              <View style={styles.customSplitDayList}>
                {customSplitDays.map((day) => {
                  const selectedTemplate = workoutTemplates.find((template) => template.id === day.workoutTemplateId) || null;
                  return (
                    <View key={day.id} style={styles.customSplitDayListRow}>
                      <View style={styles.customSplitDayListInfo}>
                        <Text style={styles.customSplitDayListTitle}>{day.fullDayLabel}</Text>
                        <Text style={[styles.customSplitDayListValue, day.isRestDay && styles.customSplitDayListValueRest]} numberOfLines={1}>
                          {day.isRestDay ? "Rest" : selectedTemplate?.name || day.label}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => setCustomSplitActionDayId(day.id)}
                        style={({ pressed }) => [styles.customSplitDayAddButton, pressed && styles.scalePressSmall]}
                      >
                        <Text style={styles.customSplitDayAddButtonText}>+</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>

              {programSaveState ? <Text style={styles.profileSaveState}>{programSaveState}</Text> : null}

              <Pressable onPress={saveCustomSplit} style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
                <Text style={styles.primaryButtonText}>Save Custom Split</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <Modal visible={Boolean(customSplitActionDayId)} transparent animationType="fade" onRequestClose={() => setCustomSplitActionDayId(null)}>
          <View style={[styles.modalOverlay, { paddingTop: Math.max(insets.top + 72, 108), paddingHorizontal: 18, paddingBottom: 18 }]}>
            <Pressable style={styles.modalBackdrop} onPress={() => setCustomSplitActionDayId(null)} />
            <View style={styles.customSplitActionSheet}>
              <Text style={styles.customSplitActionSheetTitle}>{actionDay?.fullDayLabel || "Choose an option"}</Text>
              <Text style={styles.customSplitActionSheetSubtitle}>Update this day with a saved workout, a new workout, or rest.</Text>

              <Pressable
                onPress={() => {
                  if (!actionDay) {
                    return;
                  }
                  setCustomSplitActionDayId(null);
                  setCustomSplitWorkoutPickerDayId(actionDay.id);
                }}
                style={({ pressed }) => [styles.customSplitActionOption, pressed && styles.darkPressablePressed]}
              >
                <Text style={styles.customSplitActionOptionText}>Saved Workouts</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (!actionDay) {
                    return;
                  }
                  setCustomSplitActionDayId(null);
                  setPendingCustomTemplateBuilderDayId(actionDay.id);
                }}
                style={({ pressed }) => [styles.customSplitActionOption, pressed && styles.darkPressablePressed]}
              >
                <Text style={styles.customSplitActionOptionText}>Create Workout</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (!actionDay) {
                    return;
                  }
                  setCustomDayRest(actionDay.id);
                  setCustomSplitActionDayId(null);
                }}
                style={({ pressed }) => [styles.customSplitActionOption, styles.customSplitActionOptionRest, pressed && styles.darkPressablePressed]}
              >
                <Text style={styles.customSplitActionOptionText}>Rest</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Modal visible={Boolean(customSplitWorkoutPickerDayId)} transparent animationType="fade" onRequestClose={() => setCustomSplitWorkoutPickerDayId(null)}>
          <View style={[styles.modalOverlay, { paddingTop: Math.max(insets.top + 72, 108), paddingHorizontal: 18, paddingBottom: 18 }]}>
            <Pressable style={styles.modalBackdrop} onPress={() => setCustomSplitWorkoutPickerDayId(null)} />
            <View style={styles.customSplitActionSheet}>
              <Text style={styles.customSplitActionSheetTitle}>{savedWorkoutTargetDay?.fullDayLabel || "Saved Workouts"}</Text>
              <Text style={styles.customSplitActionSheetSubtitle}>Choose a saved workout to apply to this day.</Text>
              <ScrollView style={styles.customSplitSavedWorkoutList} showsVerticalScrollIndicator={false}>
                {workoutTemplates.map((template) => (
                  <Pressable
                    key={`${savedWorkoutTargetDay?.id || "day"}-${template.id}`}
                    onPress={() => {
                      if (!savedWorkoutTargetDay) {
                        return;
                      }
                      assignTemplateToCustomDay(savedWorkoutTargetDay.id, template);
                      setCustomSplitWorkoutPickerDayId(null);
                    }}
                    style={({ pressed }) => [styles.customSplitSavedWorkoutRow, pressed && styles.darkPressablePressed]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.customSplitSavedWorkoutRowTitle}>{template.name}</Text>
                      <Text style={styles.customSplitSavedWorkoutRowMeta}>{template.exercises?.length || 0} exercises</Text>
                    </View>
                    <TriangleArrowIcon size={14} color={theme.textMuted} />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </>
    );
  };

  const renderTemplateBuilderContent = () => (
    <>
      {templateExercisePickerVisible ? (
        <>
          <TextInput
            value={templateExerciseSearchTerm}
            onChangeText={setTemplateExerciseSearchTerm}
            placeholder="Search exercises"
            placeholderTextColor="#6f817b"
            style={styles.searchInput}
          />

          <ScrollView
            style={styles.modalResults}
            contentContainerStyle={[styles.modalResultsContent, { paddingBottom: Math.max(insets.bottom + 72, 112) }]}
            keyboardShouldPersistTaps="handled"
          >
            {(templateExerciseSearchTerm.trim() ? templateExerciseResults : exerciseCatalog).slice(0, 48).map((exercise) => (
              <Pressable
                key={exercise.id}
                onPress={() => {
                  Keyboard.dismiss();
                  addExerciseToTemplateDraft(exercise);
                  setTemplateExercisePickerVisible(false);
                }}
                style={({ pressed }) => [styles.foodResultCard, pressed && styles.darkPressablePressed]}
              >
                <View style={styles.foodResultCopy}>
                  <Text style={styles.foodResultName}>{exercise.name}</Text>
                  <Text style={styles.foodResultMeta}>{exercise.muscleGroups?.join(" • ") || "Exercise"}</Text>
                </View>
                <Text style={styles.foodResultCalories}>Add</Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : (
        <>
          <TextInput
            value={templateEditor?.name || ""}
            onChangeText={(value) => setTemplateEditor((current) => current ? { ...current, name: value } : current)}
            placeholder="Workout name"
            placeholderTextColor="#6f817b"
            style={styles.searchInput}
          />

          <Pressable onPress={() => setTemplateExercisePickerVisible(true)} style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
            <Text style={styles.primaryButtonText}>Add Exercise</Text>
          </Pressable>

          <View style={styles.searchStatusCard}>
            <Text style={styles.searchStatusProvider}>Exercises</Text>
            <Text style={styles.searchStatusText}>Build a reusable workout template by adding exercises in the order you want them to appear.</Text>
          </View>

          <ScrollView style={styles.modalResults} contentContainerStyle={styles.programTemplateBuilderList} keyboardShouldPersistTaps="handled">
            {(templateEditor?.exercises || []).length ? (
              (templateEditor?.exercises || []).map((exercise, index) => (
                <View key={exercise.id} style={styles.workoutExerciseCard}>
                  <View style={styles.workoutExerciseHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.workoutExerciseName}>{index + 1}. {exercise.name}</Text>
                      <Text style={styles.workoutExerciseInfoText}>Template exercise</Text>
                    </View>
                    <Pressable onPress={() => removeTemplateDraftExercise(exercise.id)} style={({ pressed }) => [styles.rowDeleteButton, pressed && styles.removeIconButtonPressed]}>
                      <Image source={trashActionIcon} style={styles.rowDeleteButtonIcon} resizeMode="contain" />
                    </Pressable>
                  </View>

                  <View style={styles.setTableHeader}>
                    <Text style={[styles.setHeaderCell, styles.setHeaderIndex]}>Set</Text>
                    <Text style={[styles.setHeaderCell, styles.setHeaderInput]}>Weight</Text>
                    <Text style={[styles.setHeaderCell, styles.setHeaderInput]}>Reps</Text>
                  </View>

                  {(exercise.sets || []).map((set) => (
                    <View key={set.id} style={styles.workoutSetRow}>
                      <Text style={[styles.setCellText, styles.setHeaderIndex]}>{set.setNumber}</Text>
                      <TextInput
                        value={set.weight}
                        onChangeText={(value) => updateTemplateExerciseSetField(exercise.id, set.id, "weight", value)}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor="#73857d"
                        style={[styles.setInput, styles.setHeaderInput]}
                      />
                      <TextInput
                        value={set.reps}
                        onChangeText={(value) => updateTemplateExerciseSetField(exercise.id, set.id, "reps", value)}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor="#73857d"
                        style={[styles.setInput, styles.setHeaderInput]}
                      />
                      <Pressable onPress={() => deleteTemplateExerciseSet(exercise.id, set.id)} style={styles.setDeleteButton}>
                        <Text style={styles.setDeleteButtonText}>x</Text>
                      </Pressable>
                    </View>
                  ))}

                  <Pressable onPress={() => addSetToTemplateExercise(exercise.id)} style={styles.addSetWideButton}>
                    <Text style={styles.addSetWideButtonText}>+ Add Set</Text>
                  </Pressable>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Tap Add Exercise to build this saved workout.</Text>
              </View>
            )}
          </ScrollView>
        </>
      )}

      <View style={[styles.modalButtonRow, styles.templateBuilderButtonRow, styles.modalBottomActionBar, { paddingBottom: Math.max(insets.bottom - 14, 2) }]}>
        {templateExercisePickerVisible ? (
          <Pressable onPress={() => setTemplateExercisePickerVisible(false)} style={[styles.secondaryButton, styles.templateBuilderActionButton]}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
        ) : (
          <>
            <Pressable onPress={closeTemplateBuilder} style={[styles.secondaryButton, styles.templateBuilderActionButton]}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={templateSavePending}
              onPress={saveTemplateEdits}
              style={({ pressed }) => [
                styles.primaryButton,
                styles.templateBuilderActionButton,
                (pressed || templateSavePending) && styles.primaryButtonPressed,
                templateSavePending && styles.templateBuilderActionButtonDisabled,
              ]}
            >
              <Text style={styles.primaryButtonText}>Save</Text>
            </Pressable>
          </>
        )}
      </View>
    </>
  );

  const renderDiary = () => (
    <ScrollView style={styles.screenScroll} contentContainerStyle={screenContentStyle} showsVerticalScrollIndicator={false}>
      <Pressable onPress={() => setNutritionTotalsVisible(true)} style={styles.diarySummaryCard}>
        <View style={styles.summaryHeader}>
          <View>
            <Text style={styles.eyebrow}>{relativeDayLabel}</Text>
            <Text style={styles.summaryTitle}>Daily Totals</Text>
            <Text style={styles.summaryDateText}>{fullDateLabel}</Text>
          </View>
          <View style={styles.caloriePill}>
            <Text style={styles.caloriePillText}>{formatValue(totals.calories)} / {goals.calories} kcal</Text>
          </View>
        </View>

        {macroMeta.map((macro) => {
          const value = totals[macro.key];
          const progress = Math.min((value / goals[macro.key]) * 100, 100);
          return (
            <View key={macro.key} style={styles.macroRow}>
              <View style={styles.macroRowHeader}>
                <Text style={styles.macroLabel}>{macro.label}</Text>
                <Text style={styles.macroValue}>{formatValue(value)} / {goals[macro.key]} {macro.unit}</Text>
              </View>
              <View style={styles.macroTrack}>
                <View style={[styles.macroFill, { width: `${progress}%`, backgroundColor: macro.color }]} />
              </View>
            </View>
          );
        })}
      </Pressable>

      <View style={styles.card}>
        <View style={styles.dateNav}>
          <Pressable onPress={() => setSelectedDateKey((current) => shiftDateKey(current, -1))} style={({ pressed }) => [styles.dateNavButton, pressed && styles.darkPressablePressed]}>
            <TriangleArrowIcon direction="left" size={18} color={theme.textSubtle} />
          </Pressable>
          <View style={styles.dateNavCenter}>
            <Text style={styles.eyebrow}>{relativeDayLabel}</Text>
            <Text style={styles.dateNavTitle}>{fullDateLabel}</Text>
          </View>
          <Pressable onPress={() => setSelectedDateKey((current) => shiftDateKey(current, 1))} style={({ pressed }) => [styles.dateNavButton, pressed && styles.darkPressablePressed]}>
            <TriangleArrowIcon size={18} color={theme.textSubtle} />
          </Pressable>
        </View>

        <Text style={styles.eyebrow}>Meals</Text>
        <Text style={styles.cardTitle}>Food diary by meal</Text>
        <View style={styles.mealList}>
          {mealOrder.map((meal) => {
            const entries = selectedDiary[meal];
            const mealTotals = sumMacros(entries);
            return (
              <View key={meal} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mealTitle}>{meal}</Text>
                    <Text style={styles.mealSubtitle}>{formatValue(mealTotals.calories)} kcal</Text>
                  </View>
                  <Pressable onPress={() => setSearchMeal(meal)} style={styles.inlineAddButton}>
                    <Text style={styles.inlineAddButtonText}>+ Add Food</Text>
                  </Pressable>
                </View>

                {entries.length ? (
                  entries.map((entry) => (
                    <Pressable key={entry.id} onPress={() => openDiaryEntryEditor(meal, entry)} style={({ pressed }) => [styles.mealEntry, pressed && styles.darkPressablePressed]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.mealEntryTitle}>{entry.foodName}</Text>
                        <Text style={styles.mealEntryMeta}>{entry.amount} x {entry.unitLabel}</Text>
                      </View>
                      <Text style={styles.mealEntryCalories}>{formatValue(entry.calories)} kcal</Text>
                      <Pressable onPress={(event) => { event.stopPropagation?.(); removeFoodEntry(meal, entry.id); }} style={({ pressed }) => [styles.removeIconButton, pressed && styles.removeIconButtonPressed]}>
                        {({ pressed }) => (
                          <Image
                            source={trashActionIcon}
                            resizeMode="contain"
                            style={[styles.removeIconImage, { tintColor: pressed ? "#ff6b6b" : theme.textMuted }]}
                          />
                        )}
                      </Pressable>
                    </Pressable>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No foods added yet for this meal.</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.appBackgroundLayer} pointerEvents="none">
        <View style={styles.appBackgroundGlowTop} />
        <View style={styles.appBackgroundGlowBottom} />
      </View>
      <View style={styles.appShell}>
        {activeTab === "workout" ? renderWorkout() : activeTab === "progress" ? renderProgress() : renderDiary()}
      </View>
      {renderExerciseInsightSheet()}

      {!keyboardVisible && (
        <View
          onLayout={(event) => setBottomNavWidth(event.nativeEvent.layout.width)}
          style={[styles.bottomNav, { bottom: Math.max(insets.bottom - 14, 2) }]}
        >
          {bottomNavWidth ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.bottomNavIndicator,
                {
                  width: (bottomNavWidth - 12 - (6 * (tabs.length - 1))) / tabs.length,
                  transform: [{ translateX: bottomNavTranslateX }],
                },
              ]}
            />
          ) : null}
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setRootActiveTab(tab.key)}
              style={({ pressed }) => [
                styles.tabButton,
                activeTab === tab.key && styles.tabButtonActive,
                pressed && styles.tabButtonPressed,
              ]}
            >
              <Image
                source={tab.icon}
                style={[styles.tabIconImage, activeTab === tab.key ? styles.tabIconImageActive : styles.tabIconImageInactive]}
                resizeMode="contain"
              />
              <Text style={[styles.tabButtonText, activeTab === tab.key && styles.tabButtonTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <AddFoodModal
        visible={Boolean(searchMeal)}
        meal={searchMeal || "Meal"}
        favorites={favorites}
        loggedFoods={allDiaryEntries}
        customMeals={customMeals}
        customFoods={customFoods}
        onClose={() => setSearchMeal(null)}
        onAddFood={addFoodEntry}
        onToggleFavorite={handleToggleFavorite}
        onSaveCustomMeal={saveCustomMeal}
        onSaveCustomFood={saveCustomFood}
        onDeleteFavorite={deleteFavorite}
        onDeleteCustomMeal={deleteCustomMeal}
        onDeleteCustomFood={deleteCustomFood}
        onKeyboardStateChange={setKeyboardVisible}
      />

      <Modal animationType="slide" presentationStyle="pageSheet" visible={Boolean(diaryEntryEditor)} onRequestClose={() => setDiaryEntryEditor(null)}>
        <SafeAreaView edges={["top", "left", "right"]} style={styles.modalSafeArea}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.modalKeyboard, styles.modalKeyboardEditFood]}>
            <View style={[styles.modalHeader, styles.modalHeaderRoomy]}>
              <View>
                <Text style={styles.eyebrow}>Diary</Text>
                <Text style={styles.modalTitle}>Edit Food Entry</Text>
              </View>
              <Pressable onPress={() => setDiaryEntryEditor(null)} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </Pressable>
            </View>

            {diaryEntryEditor?.food ? (
              <>
              <ScrollView
                style={styles.modalResults}
                contentContainerStyle={[styles.modalResultsContent, styles.modalResultsContentTight]}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.selectedFoodCard}>
                  <View style={styles.selectedFoodHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectedFoodName}>{diaryEntryEditor.food.name}</Text>
                      <Text style={styles.selectedFoodBrand}>{diaryEntryEditor.food.brand || "Logged meal"}</Text>
                    </View>
                    <Pressable
                      onPress={() => handleToggleFavorite(diaryEntryEditor.food)}
                      style={({ pressed }) => [
                        styles.favoriteButton,
                        diaryEditorIsFavorite && styles.favoriteButtonActive,
                        pressed && styles.favoriteButtonPressed,
                      ]}
                    >
                      {({ pressed }) => (
                        <Image
                          source={diaryEditorIsFavorite || pressed ? starFilledIcon : starOutlineIcon}
                          resizeMode="contain"
                          style={[
                            styles.favoriteButtonIcon,
                            { tintColor: diaryEditorIsFavorite ? "#ffd54f" : "#f0cd58", opacity: pressed ? 0.92 : 1 },
                          ]}
                        />
                      )}
                    </Pressable>
                    <Pressable
                      onPress={deleteDiaryEntryFromEditor}
                      style={({ pressed }) => [styles.deleteGroupButton, pressed && styles.deleteGroupButtonPressed]}
                    >
                      {({ pressed }) => (
                        <Image
                          source={trashActionIcon}
                          resizeMode="contain"
                          style={[styles.deleteGroupButtonIcon, { tintColor: pressed ? "#ff6b6b" : "#96a7a0" }]}
                        />
                      )}
                    </Pressable>
                  </View>

                  <View style={styles.selectionField}>
                    <Text style={styles.selectionLabel}>Serving Size</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                      {(diaryEntryEditor.food.servings || []).map((serving) => (
                        <Pressable
                          key={serving.id}
                          onPress={() => setDiaryEntryEditor((current) => current ? { ...current, servingId: serving.id } : current)}
                          style={[styles.servingChip, diaryEntryEditor.servingId === serving.id && styles.servingChipActive]}
                        >
                          <Text style={[styles.servingChipText, diaryEntryEditor.servingId === serving.id && styles.servingChipTextActive]}>{serving.label}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.selectionRow}>
                    <View style={styles.selectionField}>
                      <Text style={styles.selectionLabel}>Servings</Text>
                      <TextInput
                        value={diaryEntryEditor.amount}
                        onChangeText={(value) => setDiaryEntryEditor((current) => current ? { ...current, amount: value } : current)}
                        keyboardType="decimal-pad"
                        placeholder="1"
                        placeholderTextColor="#8ea29c"
                        style={styles.selectionInput}
                      />
                    </View>
                    <View style={styles.selectionField}>
                      <Text style={styles.selectionLabel}>Meal</Text>
                      <View style={styles.programOptionRowCompact}>
                        {mealOrder.map((meal) => (
                          <Pressable
                            key={meal}
                            onPress={() => setDiaryEntryEditor((current) => current ? { ...current, mealAssignment: meal } : current)}
                            style={[styles.servingChip, diaryEntryEditor.mealAssignment === meal && styles.servingChipActive]}
                          >
                            <Text style={[styles.servingChipText, diaryEntryEditor.mealAssignment === meal && styles.servingChipTextActive]}>{meal}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View style={styles.modalMacroCard}>
                    {macroMeta.map((macro) => {
                      const value = diaryEditorNutrition?.[macro.key] ?? 0;
                      const progress = Math.min((value / goals[macro.key]) * 100, 100);
                      return (
                        <View key={macro.key} style={styles.modalMacroRow}>
                          <View style={styles.modalMacroCopy}>
                            <Text style={styles.modalMacroLabel}>{macro.label}</Text>
                            <Text style={styles.modalMacroValue}>
                              {formatValue(value)} / {goals[macro.key]} {macro.unit}
                            </Text>
                          </View>
                          <View style={styles.modalMacroTrack}>
                            <View style={[styles.modalMacroFill, { width: `${progress}%`, backgroundColor: macro.color }]} />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>
              <View
                style={[
                  styles.modalButtonRow,
                  styles.modalBottomActionBar,
                  styles.editFoodBottomActionBar,
                  { paddingBottom: Math.max(insets.bottom + 10, 18) },
                ]}
              >
                <Pressable onPress={() => setDiaryEntryEditor(null)} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </Pressable>
                <Pressable onPress={saveDiaryEntryEditor} style={({ pressed }) => [styles.primaryButton, styles.primaryButtonWide, pressed && styles.primaryButtonPressed]}>
                  <Text style={styles.primaryButtonText}>Save Changes</Text>
                </Pressable>
              </View>
              </>
            ) : null}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      <Modal animationType="slide" presentationStyle="pageSheet" visible={false && templateExercisePickerVisible} onRequestClose={() => setTemplateExercisePickerVisible(false)}>
        <SafeAreaView style={styles.modalSafeArea}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalKeyboard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.eyebrow}>Workout</Text>
                <Text style={styles.modalTitle}>Add Exercise</Text>
              </View>
              <Pressable onPress={() => setTemplateExercisePickerVisible(false)} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </Pressable>
            </View>

            <TextInput
              value={templateExerciseSearchTerm}
              onChangeText={setTemplateExerciseSearchTerm}
              placeholder="Search exercises"
              placeholderTextColor="#6f817b"
              style={styles.searchInput}
            />

            <ScrollView style={styles.modalResults} contentContainerStyle={[styles.modalResultsContent, { paddingBottom: Math.max(insets.bottom + 72, 112) }]} keyboardShouldPersistTaps="handled">
              {(templateExerciseSearchTerm.trim() ? templateExerciseResults : exerciseCatalog).slice(0, 48).map((exercise) => (
                <Pressable
                  key={exercise.id}
                  onPress={() => {
                    addExerciseToTemplateDraft(exercise);
                    setTemplateExercisePickerVisible(false);
                  }}
                  style={({ pressed }) => [styles.foodResultCard, pressed && styles.darkPressablePressed]}
                >
                  <View style={styles.foodResultCopy}>
                    <Text style={styles.foodResultName}>{exercise.name}</Text>
                    <Text style={styles.foodResultMeta}>{exercise.muscleGroups?.join(" • ") || "Exercise"}</Text>
                  </View>
                  <Text style={styles.foodResultCalories}>Add</Text>
                </Pressable>
              ))}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      <Modal animationType="slide" presentationStyle="fullScreen" visible={progressStatsVisible} onRequestClose={() => setProgressStatsVisible(false)}>
        <SafeAreaView edges={["left", "right"]} style={styles.modalSafeArea}>
          <View style={[styles.modalKeyboard, styles.modalKeyboardFullScreen, { paddingTop: Math.max(insets.top + 8, 28) }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.eyebrow}>Dashboard</Text>
                <Text style={styles.modalTitle}>Progress & Statistics</Text>
              </View>
              <Pressable onPress={() => setProgressStatsVisible(false)} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseButtonText}>Back</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.screenScroll} contentContainerStyle={styles.settingsContent} showsVerticalScrollIndicator={false}>
              <View style={styles.progressStatsHeroCard}>
                <Text style={styles.eyebrow}>Check-In</Text>
                <Text style={styles.cardTitle}>Daily body updates</Text>
                <Text style={styles.cardSubtle}>Log bodyweight and progress photos together so your trend data stays useful.</Text>
                <Pressable onPress={openProgressStatsCheckIn} style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
                  <Text style={styles.primaryButtonText}>Open Check-In</Text>
                </Pressable>
              </View>

              <View style={styles.progressStatsSection}>
                <View style={styles.progressStatsSectionHeader}>
                  <Text style={styles.selectionLabel}>Recent Check-Ins</Text>
                  <Pressable onPress={() => {}} style={({ pressed }) => [styles.progressStatsSeeAllButton, pressed && styles.darkPressablePressed]}>
                    <Text style={styles.progressStatsSeeAllText}>See All</Text>
                  </Pressable>
                </View>
                {progressStats.recentCheckIns.length ? progressStats.recentCheckIns.slice(0, 3).map((entry) => (
                  <View key={entry.id || entry.dateKey} style={styles.progressStatsRow}>
                    <View style={styles.progressStatsCheckInRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.progressStatsRowTitle}>{formatDateCaption(entry.dateKey)}</Text>
                        <Text style={styles.progressStatsRowMeta}>
                          {formatCompactNumber(weightUnitPreference === "kg" ? entry.weightLbs * 0.45359237 : entry.weightLbs, 1)} {weightUnitPreference}
                          {entry.sleepHours ? ` - ${formatCompactNumber(entry.sleepHours, 1)} hrs sleep` : ""}
                        </Text>
                      </View>
                      {entry.photos?.[0]?.uri ? (
                        <Image
                          source={{ uri: entry.photos[0].uri }}
                          style={styles.progressStatsCheckInThumb}
                          onError={(event) => {
                            logAppError({
                              source: "check-in-photo",
                              action: "render-thumbnail",
                              userMessage: "A check-in photo thumbnail failed to display.",
                              error: event?.nativeEvent,
                              details: {
                                dateKey: entry.dateKey,
                                photoUri: entry.photos?.[0]?.uri || "",
                              },
                            });
                          }}
                        />
                      ) : (
                        <View style={styles.progressStatsCheckInThumbPlaceholder}>
                          <Text style={styles.progressStatsCheckInThumbPlaceholderText}>No photo</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )) : (
                  <Text style={styles.emptyStateText}>No check-ins yet. Start with today's bodyweight.</Text>
                )}
              </View>

              <View style={styles.progressStatsGrid}>
                <View style={styles.progressStatsCard}>
                  <Text style={styles.eyebrow}>Body Metrics</Text>
                  <Text style={styles.progressStatsValue}>
                    {formatCompactNumber(weightUnitPreference === "kg" ? progressStats.latestWeight * 0.45359237 : progressStats.latestWeight, 1)} {weightUnitPreference}
                  </Text>
                  <Text style={styles.cardSubtle}>
                    {progressStats.weightChange >= 0 ? "+" : ""}{formatCompactNumber(weightUnitPreference === "kg" ? progressStats.weightChange * 0.45359237 : progressStats.weightChange, 1)} {weightUnitPreference} over recent check-ins
                  </Text>
                </View>
                <View style={styles.progressStatsCard}>
                  <Text style={styles.eyebrow}>Recovery</Text>
                  <Text style={styles.progressStatsValue}>{formatCompactNumber(progressStats.avgSleep, 1)} hrs</Text>
                  <Text style={styles.cardSubtle}>Average hours of sleep per night</Text>
                </View>
              </View>

              <View style={styles.progressStatsSection}>
                <Text style={styles.selectionLabel}>Nutrition Stats</Text>
                <View style={styles.progressStatsGrid}>
                  <View style={styles.progressStatsMiniCard}>
                    <Text style={styles.progressStatsMiniLabel}>Avg Calories</Text>
                    <Text style={styles.progressStatsMiniValue}>{formatCompactNumber(progressStats.avgCalories, 0)} kcal</Text>
                  </View>
                  <View style={styles.progressStatsMiniCard}>
                    <Text style={styles.progressStatsMiniLabel}>Protein</Text>
                    <Text style={styles.progressStatsMiniValue}>{progressStats.avgProtein}g</Text>
                  </View>
                  <View style={styles.progressStatsMiniCard}>
                    <Text style={styles.progressStatsMiniLabel}>Carbs</Text>
                    <Text style={styles.progressStatsMiniValue}>{progressStats.avgCarbs}g</Text>
                  </View>
                  <View style={styles.progressStatsMiniCard}>
                    <Text style={styles.progressStatsMiniLabel}>Fat</Text>
                    <Text style={styles.progressStatsMiniValue}>{progressStats.avgFat}g</Text>
                  </View>
                </View>
              </View>

              <View style={styles.progressStatsSection}>
                <Text style={styles.selectionLabel}>Workout Stats</Text>
                <View style={styles.progressStatsGrid}>
                  <View style={styles.progressStatsMiniCard}>
                    <Text style={styles.progressStatsMiniLabel}>Avg Active Heart Rate</Text>
                    <Text style={styles.progressStatsMiniValue}>-- bpm</Text>
                    <Text style={styles.progressStatsMiniSubtext}>Coming soon with wearables</Text>
                  </View>
                  <View style={styles.progressStatsMiniCard}>
                    <Text style={styles.progressStatsMiniLabel}>Avg Time</Text>
                    <Text style={styles.progressStatsMiniValue}>{progressStats.avgWorkoutMinutes || "--"} min</Text>
                  </View>
                  <View style={styles.progressStatsMiniCard}>
                    <Text style={styles.progressStatsMiniLabel}>Avg Volume</Text>
                    <Text style={styles.progressStatsMiniValue}>{formatCompactNumber(progressStats.avgWorkoutVolume, 0)} lb</Text>
                  </View>
                </View>
                {progressStats.recentPrs.length ? progressStats.recentPrs.map((item) => (
                  <View key={item.id} style={styles.progressStatsRow}>
                    <Text style={styles.progressStatsRowTitle}>{item.label}</Text>
                    <Text style={styles.progressStatsRowMeta}>{item.detail}</Text>
                  </View>
                )) : null}
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal animationType="fade" transparent visible={Boolean(dashboardPanel)} onRequestClose={() => setDashboardPanel(null)}>
        <View style={styles.scannerBackdrop}>
          <View style={styles.dashboardPanelCard}>
            <Text style={styles.eyebrow}>Dashboard</Text>
            <Text style={styles.cardTitle}>{dashboardPanel?.title || "Panel"}</Text>
            <Text style={styles.cardSubtle}>{dashboardPanel?.body || ""}</Text>
            <Pressable onPress={() => setDashboardPanel(null)} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" presentationStyle="fullScreen" visible={Boolean(settingsScreen)} onRequestClose={closeSettingsFlow}>
        <SafeAreaView edges={["left", "right"]} style={styles.modalSafeArea}>
          <View style={[styles.modalKeyboard, styles.modalKeyboardFullScreen, { paddingTop: Math.max(insets.top - 6, 24) }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.eyebrow}>Dashboard</Text>
                <Text style={styles.modalTitle}>
                  {settingsScreen === "home"
                    ? "Settings"
                    : settingsScreen === "profile"
                      ? "Profile"
                    : settingsScreen === "personal-info"
                      ? "Personal Info"
                      : settingsScreen === "account"
                        ? "Account Settings"
                        : settingsPlaceholder?.title || "Settings"}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  if (settingsScreen === "personal-info" || settingsScreen === "placeholder" || settingsScreen === "account") {
                    setSettingsScreen(settingsReturnScreen || "home");
                    setSettingsReturnScreen(null);
                    setSettingsPlaceholder(null);
                    setProfileSaveState("");
                    setAccountActionState("");
                    setCloudSyncState("");
                    return;
                  }
                  closeSettingsFlow();
                }}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseButtonText}>{settingsScreen === "home" ? "Close" : "Back"}</Text>
              </Pressable>
            </View>

            {settingsScreen === "home"
              ? renderSettingsHome()
              : settingsScreen === "profile"
                ? renderProfileScreen()
              : settingsScreen === "personal-info"
                ? renderPersonalInfoScreen()
                : settingsScreen === "account"
                  ? renderAccountScreen()
                  : renderSettingsPlaceholder()}
          </View>
        </SafeAreaView>
      </Modal>

      <Modal animationType="slide" presentationStyle="fullScreen" visible={programVisible} onRequestClose={closeProgramScreen}>
        <SafeAreaView edges={["left", "right"]} style={styles.modalSafeArea}>
          <View style={[styles.modalKeyboard, styles.modalKeyboardFullScreen, { paddingTop: Math.max(insets.top - 6, 24) }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.eyebrow}>Workout</Text>
                <Text style={styles.modalTitle}>
                  {programScreen === "home"
                    ? "My Program"
                    : programScreen === "edit"
                    ? "Edit Split"
                    : programScreen === "template-builder"
                    ? templateEditor?.id
                      ? "Edit Workout"
                      : "Create Workout"
                    : "Custom Split"}
                </Text>
              </View>
              {programScreen === "template-builder" && !templateExercisePickerVisible ? (
                <View style={styles.modalHeaderSpacer} />
              ) : (
                <Pressable
                  onPress={() => {
                    if (programScreen === "template-builder") {
                      if (templateExercisePickerVisible) {
                        setTemplateExercisePickerVisible(false);
                        return;
                      }
                      closeTemplateBuilder();
                      return;
                    }
                    if (programScreen === "custom") {
                      setProgramScreen("edit");
                      setProgramSaveState("");
                      return;
                    }
                    if (programScreen === "edit") {
                      setProgramScreen("home");
                      setProgramSaveState("");
                      return;
                    }
                    closeProgramScreen();
                  }}
                  style={styles.modalCloseButton}
                >
                  <Text style={styles.modalCloseButtonText}>
                    {programScreen === "template-builder"
                      ? "Back"
                      : programScreen === "home"
                      ? "Close"
                      : "Back"}
                  </Text>
                </Pressable>
              )}
            </View>

            {programScreen === "home"
              ? renderProgramHome()
              : programScreen === "edit"
              ? renderProgramEdit()
              : programScreen === "template-builder"
              ? renderTemplateBuilderContent()
              : renderCustomSplit()}

            {splitCellMenu ? (
              <Pressable style={styles.splitCellMenuOverlay} onPress={() => setSplitCellMenu(null)}>
                <Pressable style={styles.splitCellMenuSheet} onPress={() => {}}>
                  <Text style={styles.eyebrow}>Edit Day</Text>
                  <Text style={styles.splitCellMenuTitle}>Choose training day</Text>
                  <View style={styles.splitCellMenuOptions}>
                    {(splitCellMenu?.options || []).map((option) => {
                      const isSelected = option.label === splitCellMenu?.currentLabel;
                      return (
                        <Pressable
                          key={option.key}
                          onPress={() => applySplitCellOption(option)}
                          style={[styles.splitCellMenuOption, isSelected && styles.splitCellMenuOptionSelected]}
                        >
                          <Text style={[styles.splitCellMenuOptionText, isSelected && styles.splitCellMenuOptionTextSelected]}>
                            {option.label}
                          </Text>
                          {isSelected ? <Text style={styles.splitCellMenuCheck}>Done</Text> : null}
                        </Pressable>
                      );
                    })}
                  </View>
                  <Pressable onPress={() => setSplitCellMenu(null)} style={styles.secondaryButtonWide}>
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </Pressable>
                </Pressable>
              </Pressable>
            ) : null}
            {renderExerciseInsightSheet()}
          </View>
        </SafeAreaView>
      </Modal>

      <Modal animationType="slide" presentationStyle="fullScreen" visible={checkInVisible} onRequestClose={closeCheckInScreen}>
        <SafeAreaView edges={["left", "right"]} style={styles.modalSafeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={[styles.modalKeyboard, styles.modalKeyboardFullScreen, { paddingTop: Math.max(insets.top - 6, 24) }]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.eyebrow}>Dashboard</Text>
                <Text style={styles.modalTitle}>Check-In</Text>
              </View>
              <Pressable onPress={closeCheckInScreen} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseButtonText}>Back</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.screenScroll} contentContainerStyle={styles.settingsContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.settingsHeroCard}>
                <Text style={styles.eyebrow}>{getRelativeDayLabel(checkInDraft.dateKey || todayKey)}</Text>
                <Text style={styles.cardTitle}>Today's Check-In</Text>
                <Text style={styles.cardSubtle}>Save bodyweight and progress photos together so your physique data stays tied to the same date.</Text>
              </View>

              <View style={styles.profileFormCard}>
                <View style={styles.profileField}>
                  <Text style={styles.selectionLabel}>Date</Text>
                  <View style={styles.staticInfoPill}>
                    <Text style={styles.staticInfoText}>{formatDateCaption(checkInDraft.dateKey || todayKey)}</Text>
                  </View>
                </View>

                <View style={styles.profileField}>
                  <Text style={styles.selectionLabel}>Bodyweight (lbs)</Text>
                  <TextInput
                    value={checkInDraft.weightLbs}
                    onChangeText={(value) => setCheckInDraft((current) => ({ ...current, weightLbs: value }))}
                    placeholder="185"
                    placeholderTextColor="#6f817b"
                    keyboardType="decimal-pad"
                    style={styles.searchInput}
                  />
                </View>

                <View style={styles.profileField}>
                  <Text style={styles.selectionLabel}>Progress Photos</Text>
                  <Pressable onPress={pickCheckInPhotos} style={styles.secondaryButtonWide}>
                    <Text style={styles.secondaryButtonText}>Add Photos</Text>
                  </Pressable>
                </View>

                {(checkInDraft.photos || []).length ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.checkInPhotoRow}>
                    {checkInDraft.photos.map((photo) => (
                      <View key={photo.id} style={styles.checkInPhotoCard}>
                        <Image source={{ uri: photo.uri }} style={styles.checkInPhotoImage} />
                        <Pressable onPress={() => removeCheckInPhoto(photo.id)} style={styles.checkInPhotoRemove}>
                          <Text style={styles.checkInPhotoRemoveText}>X</Text>
                        </Pressable>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No progress photos selected yet.</Text>
                  </View>
                )}

                {checkInSaveState ? <Text style={styles.profileSaveState}>{checkInSaveState}</Text> : null}

                <Pressable onPress={saveCheckIn} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Save Check-In</Text>
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      <Modal animationType="slide" presentationStyle="pageSheet" visible={nutritionTotalsVisible} onRequestClose={() => setNutritionTotalsVisible(false)}>
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalKeyboard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.eyebrow}>{relativeDayLabel}</Text>
                <Text style={styles.modalTitle}>Nutrition Totals</Text>
              </View>
              <Pressable onPress={() => setNutritionTotalsVisible(false)} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalResults} contentContainerStyle={styles.modalResultsContent} showsVerticalScrollIndicator={false}>
              {dailyNutritionSections.map((section) => (
                <View key={section.title} style={styles.nutritionSectionCard}>
                  <Text style={styles.cardTitle}>{section.title}</Text>
                  {section.rows.length ? (
                    section.rows.map((row) => {
                      const progress = row.target ? Math.min((toNumber(row.amount) / row.target) * 100, 100) : 0;
                      return (
                        <View key={row.key} style={styles.nutritionProgressRow}>
                          <View style={styles.nutritionProgressHeader}>
                            <Text style={styles.nutritionProgressLabel}>{row.label}</Text>
                            <Text style={styles.nutritionProgressValue}>
                              {formatValue(row.amount)} {row.target ? `/ ${formatValue(row.target)} ` : ""}{row.unit}
                              {row.target ? ` - ${Math.round(progress)}%` : ""}
                            </Text>
                          </View>
                          {row.target ? (
                            <View style={styles.nutritionProgressTrack}>
                              <View
                                style={[
                                  styles.nutritionProgressFill,
                                  { width: `${Math.max(progress, 0)}%`, backgroundColor: row.color || theme.accent },
                                ]}
                              />
                            </View>
                          ) : null}
                        </View>
                      );
                    })
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No data logged in this category yet.</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal animationType="slide" presentationStyle="pageSheet" visible={exercisePickerVisible} onRequestClose={() => setExercisePickerVisible(false)}>
        <SafeAreaView style={styles.modalSafeArea}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.modalKeyboard}
            >
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.eyebrow}>Workout</Text>
                  <Text style={styles.modalTitle}>Add Exercise</Text>
                </View>
                <Pressable onPress={() => setExercisePickerVisible(false)} style={styles.modalCloseButton}>
                  <Text style={styles.modalCloseButtonText}>Close</Text>
                </Pressable>
              </View>

              <TextInput
                value={exerciseSearchTerm}
                onChangeText={setExerciseSearchTerm}
                placeholder="Search exercises"
                placeholderTextColor="#6f817b"
                style={styles.searchInput}
              />

              <View style={styles.searchStatusCard}>
                <Text style={styles.searchStatusProvider}>Exercise Database</Text>
                <Text style={styles.searchStatusText}>Choose an exercise to add it to the active workout. Each new exercise starts with one blank set row.</Text>
              </View>

              <ScrollView
                style={styles.modalResults}
                contentContainerStyle={styles.modalResultsContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {exerciseResults.map((exercise) => (
                  <Pressable key={exercise.id} onPress={() => addExerciseToWorkout(exercise)} style={styles.exerciseResultCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.foodResultName}>{exercise.name}</Text>
                      <Text style={styles.foodResultMeta}>{exercise.equipment} - {exercise.muscleGroups.join(", ")}</Text>
                    </View>
                    <Text style={styles.exerciseResultAction}>Add</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </Modal>

      <Modal animationType="fade" transparent visible={finishWorkoutVisible} onRequestClose={resetWorkoutFinishFlow}>
        <View style={styles.scannerBackdrop}>
          <View style={styles.finishWorkoutCard}>
            <Text style={styles.eyebrow}>Finish Workout</Text>
            <Text style={styles.cardTitle}>{activeWorkout?.name || "Workout"}</Text>
            <Text style={styles.cardSubtle}>
              {activeWorkout?.templateId && activeWorkoutTemplateChanged
                ? "This workout will be saved to your history. Your template changed during this session - update My Workouts too?"
                : activeWorkout?.templateId
                ? "This workout will be saved to your history when you finish it."
                : "This workout will be saved to your history. Do you also want to save it to My Workouts?"}
            </Text>

            {!activeWorkout?.templateId && activeWorkout?.exercises?.length && finishWorkoutPromptStep === "naming" ? (
              <TextInput
                value={saveAsTemplateDraftName}
                onChangeText={setSaveAsTemplateDraftName}
                placeholder="Workout name for My Workouts"
                placeholderTextColor="#6f817b"
                style={styles.searchInput}
              />
            ) : null}

            <View style={styles.modalButtonColumn}>
              {!activeWorkout?.templateId && activeWorkout?.exercises?.length && finishWorkoutPromptStep === "prompt" ? (
                <Pressable
                  onPress={() => setFinishWorkoutPromptStep("naming")}
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
                >
                  <Text style={styles.primaryButtonText}>Save to My Workouts</Text>
                </Pressable>
              ) : null}

              {!activeWorkout?.templateId && activeWorkout?.exercises?.length && finishWorkoutPromptStep === "prompt" ? (
                <Pressable onPress={() => completeWorkout({ saveTemplate: false })} style={({ pressed }) => [styles.secondaryButtonWide, pressed && styles.darkPressablePressed]}>
                  <Text style={styles.secondaryButtonTextAccent}>Finish Workout</Text>
                </Pressable>
              ) : null}

              {!activeWorkout?.templateId && finishWorkoutPromptStep === "prompt" ? (
                <Pressable onPress={() => completeWorkout({ saveTemplate: false, saveHistory: false })} style={({ pressed }) => [styles.neutralButtonWide, pressed && styles.darkPressablePressed]}>
                  <Text style={styles.neutralButtonText}>Do Not Save</Text>
                </Pressable>
              ) : null}

              {!activeWorkout?.templateId && activeWorkout?.exercises?.length && finishWorkoutPromptStep === "naming" ? (
                <>
                  <Pressable
                    onPress={() => completeWorkout({ saveTemplate: true, templateName: saveAsTemplateDraftName || activeWorkout?.name || "Workout" })}
                    style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
                  >
                    <Text style={styles.primaryButtonText}>Finish & Save Workout</Text>
                  </Pressable>
                  <Pressable onPress={() => setFinishWorkoutPromptStep("prompt")} style={({ pressed }) => [styles.secondaryButtonWide, pressed && styles.darkPressablePressed]}>
                    <Text style={styles.secondaryButtonText}>Back</Text>
                  </Pressable>
                </>
              ) : null}

              {activeWorkout?.templateId && finishWorkoutPromptStep === "template-update" ? (
                <>
                  <Pressable onPress={() => completeWorkout({ updateTemplate: true })} style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
                    <Text style={styles.primaryButtonText}>Update My Workout</Text>
                  </Pressable>
                  <Pressable onPress={() => completeWorkout({ saveTemplate: false })} style={({ pressed }) => [styles.secondaryButtonWide, pressed && styles.darkPressablePressed]}>
                    <Text style={styles.secondaryButtonTextAccent}>Finish Workout</Text>
                  </Pressable>
                  <Pressable onPress={() => completeWorkout({ saveTemplate: false, saveHistory: false })} style={({ pressed }) => [styles.neutralButtonWide, pressed && styles.darkPressablePressed]}>
                    <Text style={styles.neutralButtonText}>Do Not Save</Text>
                  </Pressable>
                </>
              ) : null}

              {activeWorkout?.templateId && finishWorkoutPromptStep !== "template-update" ? (
                <>
                  <Pressable onPress={() => completeWorkout({ saveTemplate: false })} style={({ pressed }) => [styles.secondaryButtonWide, pressed && styles.darkPressablePressed]}>
                    <Text style={styles.secondaryButtonTextAccent}>Finish Workout</Text>
                  </Pressable>
                  <Pressable onPress={() => completeWorkout({ saveTemplate: false, saveHistory: false })} style={({ pressed }) => [styles.neutralButtonWide, pressed && styles.darkPressablePressed]}>
                    <Text style={styles.neutralButtonText}>Do Not Save</Text>
                  </Pressable>
                </>
              ) : null}

              <Pressable onPress={resetWorkoutFinishFlow} style={({ pressed }) => [styles.ghostButton, pressed && styles.darkPressablePressed]}>
                <Text style={styles.ghostButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={timerEditorVisible} onRequestClose={closeTimerEditor}>
        <View style={styles.scannerBackdrop}>
          <View style={styles.finishWorkoutCard}>
            <Text style={styles.eyebrow}>Workout Timer</Text>
            <Text style={styles.cardTitle}>Adjust Session Time</Text>
            <Text style={styles.cardSubtle}>
              Pause the workout clock or manually correct the time if it kept running after your session.
            </Text>

            <View style={styles.timerEditorColumns}>
              <View style={styles.timerEditorColumn}>
                <Text style={styles.selectionLabel}>Hours</Text>
                <ScrollView style={styles.timerNumberList} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 13 }, (_, index) => (
                    <Pressable
                      key={`hour-${index}`}
                      onPress={() => setTimerDraftHours(index)}
                      style={[styles.timerNumberOption, timerDraftHours === index && styles.timerNumberOptionActive]}
                    >
                      <Text style={[styles.timerNumberText, timerDraftHours === index && styles.timerNumberTextActive]}>{index}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.timerEditorColumn}>
                <Text style={styles.selectionLabel}>Minutes</Text>
                <ScrollView style={styles.timerNumberList} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 60 }, (_, index) => (
                    <Pressable
                      key={`minute-${index}`}
                      onPress={() => setTimerDraftMinutes(index)}
                      style={[styles.timerNumberOption, timerDraftMinutes === index && styles.timerNumberOptionActive]}
                    >
                      <Text style={[styles.timerNumberText, timerDraftMinutes === index && styles.timerNumberTextActive]}>
                        {String(index).padStart(2, "0")}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalButtonColumn}>
              <Pressable onPress={saveTimerAdjustment} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Save Timer</Text>
              </Pressable>
              <Pressable onPress={closeTimerEditor} style={styles.ghostButton}>
                <Text style={styles.ghostButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={Boolean(finishedWorkoutSummary)} onRequestClose={closeFinishedWorkoutSummary}>
        <View style={styles.scannerBackdrop}>
          <View style={styles.workoutSummaryCard}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.workoutSummaryContent}>
              <Text style={styles.eyebrow}>Workout Saved</Text>
              <Text style={styles.cardTitle}>{finishedWorkoutSummary?.name || "Workout"}</Text>
              <Text style={styles.cardSubtle}>
                {finishedWorkoutSummary?.completedAt
                  ? `Completed ${new Date(finishedWorkoutSummary.completedAt).toLocaleDateString([], { month: "short", day: "numeric" })} at ${new Date(finishedWorkoutSummary.completedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
                  : "Your workout has been saved to history."}
              </Text>

              <View style={styles.summaryMetricGrid}>
                <View style={styles.summaryMetricCard}>
                  <Text style={styles.summaryMetricLabel}>Duration</Text>
                  <Text style={styles.summaryMetricValue}>{finishedWorkoutSummary?.summary?.durationLabel || "0m 00s"}</Text>
                </View>
                <View style={styles.summaryMetricCard}>
                  <Text style={styles.summaryMetricLabel}>Total Volume</Text>
                  <Text style={styles.summaryMetricValue}>{formatValue(finishedWorkoutSummary?.summary?.totalVolume || 0)}</Text>
                </View>
                <View style={styles.summaryMetricCard}>
                  <Text style={styles.summaryMetricLabel}>PR Sets</Text>
                  <Text style={styles.summaryMetricValue}>{finishedWorkoutSummary?.summary?.prSets?.length || 0}</Text>
                </View>
                <View style={styles.summaryMetricCard}>
                  <Text style={styles.summaryMetricLabel}>Avg HR</Text>
                  <Text style={styles.summaryMetricValue}>
                    {finishedWorkoutSummary?.summary?.averageHeartRate ? `${finishedWorkoutSummary.summary.averageHeartRate} bpm` : "Soon"}
                  </Text>
                </View>
              </View>

              <View style={styles.summarySection}>
                <Text style={styles.summarySectionTitle}>Volume by Muscle</Text>
                {finishedWorkoutSummary?.summary?.muscleBreakdown?.length ? (
                  finishedWorkoutSummary.summary.muscleBreakdown.map((item) => (
                    <View key={item.muscle} style={styles.summaryBreakdownRow}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.summaryBreakdownHeader}>
                          <Text style={styles.summaryBreakdownMuscle}>{item.muscle}</Text>
                          <Text style={styles.summaryBreakdownPercent}>{Math.round(item.percentage)}%</Text>
                        </View>
                        <View style={styles.summaryBreakdownTrack}>
                          <View style={[styles.summaryBreakdownFill, { width: `${Math.max(item.percentage, 6)}%` }]} />
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>Log weight and reps to see muscle volume distribution.</Text>
                  </View>
                )}
              </View>

              <View style={styles.summarySection}>
                <Text style={styles.summarySectionTitle}>PR Highlights</Text>
                {finishedWorkoutSummary?.summary?.prSets?.length ? (
                  finishedWorkoutSummary.summary.prSets.map((set) => (
                    <View key={set.id} style={styles.prHighlightCard}>
                      <Text style={styles.prHighlightTitle}>{set.exerciseName} - Set {set.setNumber}</Text>
                      <Text style={styles.prHighlightText}>
                        {set.weight} x {set.reps} for {formatValue(set.volume)} volume
                      </Text>
                      <Text style={styles.prHighlightSubtle}>Previous best {formatValue(set.previousBestVolume)}</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No PR sets this time. Future sessions will compare against your logged history.</Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <Pressable onPress={closeFinishedWorkoutSummary} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" presentationStyle="pageSheet" visible={Boolean(templateEditor) && programScreen !== "template-builder"} onRequestClose={closeTemplateBuilder}>
        <SafeAreaView edges={["top", "left", "right"]} style={styles.modalSafeArea}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.modalKeyboard}
            >
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.eyebrow}>{templateExercisePickerVisible ? "Workout" : "My Workouts"}</Text>
                  <Text style={styles.modalTitle}>
                    {templateExercisePickerVisible ? "Add Exercise" : templateEditor?.id ? "Edit Workout" : "Create Workout"}
                  </Text>
                </View>
                {templateExercisePickerVisible ? (
                  <Pressable
                    onPress={() => {
                      setTemplateExercisePickerVisible(false);
                    }}
                    style={styles.modalCloseButton}
                  >
                    <Text style={styles.modalCloseButtonText}>Back</Text>
                  </Pressable>
                ) : (
                  <View style={styles.modalHeaderSpacer} />
                )}
              </View>

              {renderTemplateBuilderContent()}
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </Modal>

      <Modal animationType="slide" presentationStyle="pageSheet" visible={Boolean(historyEditorWorkout)} onRequestClose={closeHistoryWorkoutDetails}>
        <SafeAreaView edges={["top", "left", "right"]} style={styles.modalSafeArea}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.modalKeyboard}
            >
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.eyebrow}>Workout History</Text>
                  <Text style={styles.modalTitle}>{historyEditorWorkout?.name || "Workout"}</Text>
                </View>
                <Pressable onPress={closeHistoryWorkoutDetails} style={styles.modalCloseButton}>
                  <Text style={styles.modalCloseButtonText}>Close</Text>
                </Pressable>
              </View>

              <View style={styles.workoutDateEditorRow}>
                <Pressable onPress={() => shiftHistoryEditorDate(-1)} style={({ pressed }) => [styles.dateNavButtonTiny, pressed && styles.darkPressablePressed]}>
                  <TriangleArrowIcon direction="left" size={16} color={theme.textSubtle} />
                </Pressable>
                <Text style={styles.workoutDateEditorText}>{formatDateCaption(historyEditorWorkout?.dateKey || todayKey)}</Text>
                <Pressable onPress={() => shiftHistoryEditorDate(1)} style={({ pressed }) => [styles.dateNavButtonTiny, pressed && styles.darkPressablePressed]}>
                  <TriangleArrowIcon size={16} color={theme.textSubtle} />
                </Pressable>
              </View>

              <ScrollView style={styles.modalResults} contentContainerStyle={styles.modalResultsContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {historyEditorWorkout?.exercises.map((exercise) => (
                  <View key={exercise.id} style={styles.workoutExerciseCard}>
                    <Pressable onPress={() => openExerciseInsight(exercise)} style={styles.historyExerciseInfoTrigger}>
                      <Text style={styles.workoutExerciseName}>{exercise.name}</Text>
                      <Text style={styles.workoutExerciseInfoText}>
                        {formatMuscleGroupsInline(getWorkoutExerciseDefinition(exercise)?.muscleGroups || exercise.muscleGroups || [], "Muscles not assigned")}
                      </Text>
                    </Pressable>
                    <View style={styles.setTableHeader}>
                      <Text style={[styles.setHeaderCell, styles.setHeaderIndex]}>Set</Text>
                      <Text style={[styles.setHeaderCell, styles.setHeaderPrev]}>Prev</Text>
                      <Text style={[styles.setHeaderCell, styles.setHeaderInput]}>Weight</Text>
                      <Text style={[styles.setHeaderCell, styles.setHeaderInput]}>Reps</Text>
                      <Text style={[styles.setHeaderCell, styles.setHeaderCheck]}>Done</Text>
                    </View>

                    {exercise.sets.map((set) => (
                      <View key={set.id} style={[styles.workoutSetRow, set.completed && styles.workoutSetRowCompleted]}>
                        <Text style={[styles.setCellText, styles.setHeaderIndex]}>{set.setNumber}</Text>
                        <Text style={[styles.setPrevText, styles.setHeaderPrev]}>{set.previous || "--"}</Text>
                        <TextInput
                          value={set.weight}
                          onChangeText={(value) => updateHistoryWorkoutSetField(exercise.id, set.id, "weight", value)}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor="#73857d"
                          style={[styles.setInput, styles.setHeaderInput]}
                        />
                        <TextInput
                          value={set.reps}
                          onChangeText={(value) => updateHistoryWorkoutSetField(exercise.id, set.id, "reps", value)}
                          keyboardType="number-pad"
                          placeholder="0"
                          placeholderTextColor="#73857d"
                          style={[styles.setInput, styles.setHeaderInput]}
                        />
                        <Pressable onPress={() => updateHistoryWorkoutSetField(exercise.id, set.id, "completed", !set.completed)} style={[styles.setCheck, set.completed && styles.setCheckActive, styles.setHeaderCheck]}>
                          <Text style={[styles.setCheckText, set.completed && styles.setCheckTextActive]}>{set.completed ? "\u2713" : "\u25CB"}</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>

              <View style={[styles.modalButtonRow, styles.modalBottomActionBar, { paddingBottom: Math.max(insets.bottom - 14, 2) }]}>
                <Pressable onPress={closeHistoryWorkoutDetails} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={saveHistoryWorkoutEdits} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Save Edits</Text>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </Modal>

      <Modal animationType="fade" transparent visible={Boolean(setTypeMenu)} onRequestClose={() => setSetTypeMenu(null)}>
        <View style={styles.splitCellMenuOverlay}>
          <Pressable style={styles.splitCellMenuOverlay} onPress={() => setSetTypeMenu(null)}>
            <Pressable style={styles.splitCellMenuSheet} onPress={() => {}}>
              <Text style={styles.eyebrow}>Set Type</Text>
              <Text style={styles.splitCellMenuTitle}>Select set style</Text>
              <View style={styles.splitCellMenuOptions}>
                {Object.entries(workoutSetTypeMeta).map(([key, meta]) => {
                  const currentSetType = activeWorkout?.exercises
                    ?.find((exercise) => exercise.id === setTypeMenu?.exerciseInstanceId)
                    ?.sets?.find((set) => set.id === setTypeMenu?.setId)
                    ?.setType || "normal";
                  const isSelected = key === currentSetType;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => applyWorkoutSetType(key)}
                      style={[styles.splitCellMenuOption, isSelected && styles.splitCellMenuOptionSelected]}
                    >
                      <View style={styles.setTypeMenuOptionLeft}>
                        <Text style={[styles.setTypeMenuSwatch, { color: meta.color }]}>\u25CF</Text>
                        <Text style={[styles.splitCellMenuOptionText, isSelected && styles.splitCellMenuOptionTextSelected]}>
                          {meta.label}
                        </Text>
                      </View>
                      {isSelected ? <Text style={styles.splitCellMenuCheck}>\u2713</Text> : null}
                    </Pressable>
                  );
                })}
              </View>
              <Pressable onPress={() => setSetTypeMenu(null)} style={styles.secondaryButtonWide}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function RootApp() {
  return (
    <SafeAreaProvider>
      <App />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.bg,
    overflow: "hidden",
  },
  appBackgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.bg,
  },
  appBackgroundGlowTop: {
    position: "absolute",
    top: -180,
    left: -90,
    right: -90,
    height: 320,
    borderRadius: 999,
    backgroundColor: "rgba(0, 255, 153, 0.07)",
  },
  appBackgroundGlowBottom: {
    position: "absolute",
    left: -60,
    right: -60,
    bottom: -210,
    height: 300,
    borderRadius: 999,
    backgroundColor: "rgba(0, 255, 153, 0.05)",
  },
  appShell: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  screenScroll: {
    flex: 1,
  },
  screenContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
    gap: 14,
  },
  heroCard: {
    backgroundColor: theme.panel,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.border,
  },
  eyebrow: {
    color: theme.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  heroTitle: {
    color: theme.text,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  heroBody: {
    color: theme.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  card: {
    backgroundColor: theme.panel,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 12,
  },
  diarySummaryCard: {
    backgroundColor: theme.panel,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    shadowColor: theme.accent,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
    gap: 8,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  summaryTitle: {
    color: theme.text,
    fontSize: 22,
    fontWeight: "800",
  },
  summaryDateText: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  caloriePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.accentSoft,
  },
  caloriePillText: {
    color: theme.accent,
    fontSize: 13,
    fontWeight: "800",
  },
  macroRow: {
    gap: 4,
  },
  macroRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  macroLabel: {
    color: theme.text,
    fontWeight: "700",
    fontSize: 13,
  },
  macroValue: {
    color: theme.textMuted,
    fontSize: 12,
  },
  macroTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  macroFill: {
    height: "100%",
    borderRadius: 999,
  },
  nutritionSectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panel,
    padding: 14,
    gap: 10,
  },
  nutritionProgressRow: {
    gap: 6,
  },
  nutritionProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  nutritionProgressLabel: {
    color: theme.text,
    fontSize: 13,
    fontWeight: "700",
  },
  nutritionProgressValue: {
    color: theme.textMuted,
    fontSize: 12,
    textAlign: "right",
    flexShrink: 1,
  },
  nutritionProgressTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  nutritionProgressFill: {
    height: "100%",
    borderRadius: 999,
  },
  cardTitle: {
    color: theme.text,
    fontSize: 22,
    fontWeight: "800",
  },
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 2,
    paddingVertical: 2,
  },
  dateNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.panelAlt,
  },
  dateNavButtonText: {
    color: theme.text,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 24,
  },
  dateNavButtonTiny: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.panelAlt,
  },
  workoutDateEditorRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  workoutDateEditorText: {
    color: theme.accent,
    fontSize: 13,
    fontWeight: "800",
  },
  dateNavCenter: {
    flex: 1,
    alignItems: "center",
  },
  dateNavTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "800",
  },
  cardSubtle: {
    color: theme.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  dashboardHero: {
    gap: 10,
  },
  progressOverviewCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    backgroundColor: "#0b0f0d",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    shadowColor: theme.accent,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  dashboardScreen: {
    flex: 1,
  },
  dashboardScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 168,
    gap: 12,
  },
  dashboardStickyHeader: {
    width: "100%",
    marginBottom: 6,
    paddingBottom: 6,
    paddingHorizontal: 0,
    backgroundColor: theme.bg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
    position: "relative",
  },
  dashboardHeaderRow: {
    width: "100%",
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dashboardHeaderTitle: {
    color: theme.accent,
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: 0.28,
    textTransform: "uppercase",
    textAlign: "center",
  },
  dashboardHeaderIconButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  dashboardTodayCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    backgroundColor: "#0b0f0d",
    padding: 18,
    gap: 10,
    shadowColor: theme.accent,
    shadowOpacity: 0.11,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  dashboardTodayEyebrow: {
    color: theme.accent,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  dashboardTodayTitle: {
    color: theme.text,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 32,
  },
  dashboardTodaySubtitle: {
    color: theme.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  dashboardTodayActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  dashboardPrimaryActionButton: {
    minHeight: 46,
    borderRadius: 18,
    backgroundColor: theme.accent,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dashboardPrimaryActionText: {
    color: theme.accentTextDark,
    fontSize: 14,
    fontWeight: "900",
  },
  dashboardSecondaryActionButton: {
    minHeight: 44,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dashboardSecondaryActionText: {
    color: theme.text,
    fontSize: 13,
    fontWeight: "800",
  },
  progressOverviewTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  progressOverviewEyebrow: {
    color: theme.accent,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  progressOverviewTitle: {
    color: theme.text,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 2,
  },
  progressOverviewSubtitle: {
    color: theme.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  progressOverviewArrowButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    backgroundColor: "rgba(0,255,153,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  progressOverviewChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  progressOverviewChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  progressOverviewChipText: {
    color: theme.textSubtle,
    fontSize: 11,
    fontWeight: "800",
  },
  dashboardProgramCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#0b0f0d",
    padding: 16,
    gap: 12,
  },
  dashboardProgramHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dashboardProgramArrowButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    backgroundColor: "rgba(0,255,153,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  dashboardProgramTitle: {
    color: theme.text,
    fontSize: 22,
    fontWeight: "800",
  },
  dashboardProgramSubtitle: {
    color: theme.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  dashboardProgramActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  dashboardProgramOpenButton: {
    paddingHorizontal: 16,
  },
  dashboardInlineAction: {
    minHeight: 44,
    borderRadius: 17,
    backgroundColor: theme.accentSoft,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.accentBorder,
  },
  dashboardInlineActionText: {
    color: theme.accent,
    fontSize: 13,
    fontWeight: "900",
  },
  dashboardRecentCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#0b0f0d",
    padding: 14,
    gap: 10,
  },
  dashboardRecentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  dashboardRecentLabel: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dashboardRecentValue: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 2,
  },
  dashboardRecentMeta: {
    color: theme.textSubtle,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
  },
  dashboardChartsSection: {
    gap: 10,
  },
  dashboardSectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dashboardSectionTitle: {
    color: theme.text,
    fontSize: 20,
    fontWeight: "800",
  },
  dashboardHeaderIconText: {
    color: theme.accent,
    fontSize: 12,
    fontWeight: "900",
  },
  dashboardCarouselContent: {
    paddingRight: 2,
  },
  dashboardChartCard: {
    overflow: "hidden",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#0b0f0d",
    padding: 18,
    gap: 14,
  },
  dashboardChartGlow: {
    position: "absolute",
    top: 18,
    right: 16,
    width: 110,
    height: 110,
    borderRadius: 999,
    backgroundColor: "rgba(0,255,153,0.04)",
  },
  dashboardRangeOrbWrap: {
    position: "absolute",
    top: 18,
    right: 16,
    width: 110,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  dashboardChartHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  dashboardChartTitle: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  dashboardChartValueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 10,
  },
  dashboardChartValue: {
    color: theme.accent,
    fontSize: 46,
    lineHeight: 48,
    fontWeight: "900",
  },
  dashboardChartUnit: {
    color: theme.textSubtle,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  dashboardChartTrendRow: {
    marginTop: 4,
    gap: 3,
  },
  dashboardChartTrend: {
    color: theme.accent,
    fontSize: 16,
    fontWeight: "800",
  },
  dashboardChartSubtitle: {
    color: theme.textMuted,
    fontSize: 13,
  },
  dashboardRangeButton: {
    minWidth: 88,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  dashboardRangeButtonText: {
    color: theme.text,
    fontSize: 13,
    fontWeight: "800",
  },
  dashboardRangeButtonCaret: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  dashboardChartFrame: {
    marginTop: 4,
  },
  dashboardChartKitWrap: {
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "rgba(0,255,153,0.03)",
    paddingTop: 10,
    paddingRight: 8,
    paddingLeft: 6,
  },
  dashboardChartAxisLabel: {
    position: "absolute",
    left: 14,
    top: 10,
    zIndex: 1,
    color: theme.textMuted,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  dashboardChartKit: {
    marginLeft: -6,
    borderRadius: 22,
  },
  dashboardDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dashboardDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: theme.accent,
    transform: [{ scale: 1 }],
  },
  dashboardDotActive: {
    transform: [{ scale: 1.55 }],
  },
  dashboardActionStack: {
    gap: 14,
  },
  dashboardActionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#0b0f0d",
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  darkPressablePressed: {
    opacity: 0.84,
    borderColor: theme.accentBorder,
  },
  scalePressSmall: {
    transform: [{ scale: 0.98 }],
  },
  primaryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  finishButtonPressed: {
    opacity: 0.9,
    borderColor: theme.accentBorder,
    transform: [{ scale: 0.97 }],
  },
  dashboardActionIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  dashboardActionIcon: {
    color: theme.accent,
    fontSize: 34,
    fontWeight: "800",
  },
  dashboardActionCopy: {
    flex: 1,
    gap: 6,
  },
  dashboardActionTitle: {
    color: theme.text,
    fontSize: 20,
    fontWeight: "900",
  },
  dashboardActionSubtitle: {
    color: theme.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  dashboardChevronWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  dashboardChevron: {
    color: theme.accent,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 24,
  },
  programHeroCard: {
    gap: 8,
    paddingHorizontal: 2,
  },
  programTitle: {
    color: theme.text,
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: -1.2,
  },
  programSubtitle: {
    color: theme.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  programSectionCard: {
    backgroundColor: "#0b0f0d",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
    gap: 16,
  },
  programSectionHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  programSectionSubtitle: {
    color: theme.textMuted,
    fontSize: 14,
    marginTop: 6,
  },
  programWeekArrowRow: {
    flexDirection: "row",
    gap: 10,
  },
  programArrowButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  programArrowButtonText: {
    color: theme.text,
    fontSize: 26,
    fontWeight: "500",
    marginTop: -2,
  },
  programCalendarButtonIcon: {
    color: theme.textSubtle,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  programCalendarModal: {
    width: "84%",
    maxWidth: 336,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#0b0f0d",
    padding: 14,
    gap: 10,
    alignSelf: "center",
    marginTop: 108,
  },
  programCalendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  programCalendarTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "800",
  },
  programCalendarWeekdayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  programCalendarWeekday: {
    width: 36,
    textAlign: "center",
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  programCalendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  programCalendarDayButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  programCalendarDayButtonMuted: {
    opacity: 0.42,
  },
  programCalendarDayButtonSelected: {
    borderColor: theme.accent,
    backgroundColor: "rgba(0,255,153,0.12)",
  },
  programCalendarDayButtonToday: {
    borderColor: "rgba(0,255,153,0.34)",
  },
  programCalendarDayText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "700",
  },
  programCalendarDayTextMuted: {
    color: theme.textMuted,
  },
  programCalendarDayTextSelected: {
    color: theme.accent,
  },
  programCalendarDayTextToday: {
    color: theme.text,
  },
  programWeekCardRow: {
    gap: 10,
    paddingRight: 6,
    alignItems: "flex-start",
  },
  programDayCellWrap: {
    alignItems: "center",
    gap: 6,
  },
  programDayCard: {
    width: 94,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0a0d0c",
  },
  programDayCardToday: {
    borderColor: "rgba(0,255,153,0.35)",
  },
  programDayCardSelected: {
    borderColor: theme.accent,
    backgroundColor: "rgba(0,255,153,0.11)",
    shadowColor: theme.accent,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  programDayCardTodaySelected: {
    backgroundColor: "rgba(0,255,153,0.15)",
  },
  programDayTopRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  programDayLabel: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  programDayLabelToday: {
    color: theme.accent,
  },
  programDayLabelSelected: {
    color: theme.text,
  },
  programTodayPillFloating: {
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "rgba(0,255,153,0.14)",
    borderWidth: 1,
    borderColor: "rgba(0,255,153,0.24)",
    alignSelf: "center",
  },
  programTodayPillSpacer: {
    height: 18,
  },
  programTodayPill: {
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "rgba(0,255,153,0.14)",
    borderWidth: 1,
    borderColor: "rgba(0,255,153,0.24)",
  },
  programTodayPillText: {
    color: theme.accent,
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  programDayNumber: {
    color: theme.text,
    fontSize: 28,
    fontWeight: "800",
  },
  programDayNumberSelected: {
    color: theme.text,
  },
  programDayStatusDotSlot: {
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  programDayStatusDotWrap: {
    minWidth: 18,
    minHeight: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  programDayStatusDotWrapSelected: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(180,194,188,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  programDayStatusDotText: {
    color: theme.accent,
    fontSize: 16,
    fontWeight: "900",
  },
  programDayStatusBulletIcon: {
    width: 8,
    height: 8,
  },
  programDayWorkoutLabel: {
    color: theme.textSubtle,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  programDayWorkoutLabelSelected: {
    color: theme.text,
  },
  programDayWorkoutLabelToday: {
    color: theme.accent,
  },
  programWeekSummaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  programWeekSummaryRing: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 6,
    borderColor: theme.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  programWeekSummaryRingText: {
    color: theme.text,
    fontSize: 21,
    fontWeight: "900",
  },
  programWeekSummaryTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "800",
  },
  programWeekSummaryBody: {
    color: theme.textMuted,
    fontSize: 15,
    marginTop: 4,
  },
  programWeekSummaryPercent: {
    color: theme.accent,
    fontSize: 24,
    fontWeight: "900",
  },
  programEditButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
  },
  programEditButtonText: {
    color: theme.accent,
    fontSize: 18,
    fontWeight: "800",
  },
  programEditButtonChevron: {
    color: theme.accent,
    fontSize: 24,
    fontWeight: "500",
  },
  programWorkoutTitle: {
    color: theme.text,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  programWorkoutSubtitle: {
    color: theme.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginTop: -6,
  },
  programWorkoutMetaGrid: {
    flexDirection: "row",
    gap: 10,
  },
  programMetaCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  programMetaValue: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "800",
  },
  programMetaLabel: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 4,
    fontWeight: "700",
  },
  programExercisePreview: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  programHistoryBlock: {
    gap: 10,
  },
  programExerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  programExerciseName: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    paddingRight: 8,
  },
  programExerciseChevron: {
    color: theme.textMuted,
    fontSize: 24,
  },
  exerciseInsightMuscleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  exerciseInsightMuscleChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.accentSoft,
    borderWidth: 1,
    borderColor: theme.accentBorder,
  },
  exerciseInsightMuscleChipText: {
    color: theme.accent,
    fontSize: 13,
    fontWeight: "800",
  },
  exerciseInsightRecordCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panelAlt,
    padding: 16,
    gap: 6,
  },
  exerciseInsightRecordLabel: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  exerciseInsightRecordValue: {
    color: theme.text,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  exerciseInsightRecordDetail: {
    color: theme.textSubtle,
    fontSize: 14,
    lineHeight: 20,
  },
  exerciseInsightEmptyText: {
    color: theme.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  exerciseInsightOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 40,
    elevation: 40,
  },
  exerciseInsightBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3, 8, 6, 0.46)",
  },
  exerciseInsightSheet: {
    maxHeight: "72%",
    backgroundColor: "#0a100d",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 14,
  },
  exerciseInsightHandleWrap: {
    alignItems: "center",
    paddingBottom: 4,
  },
  exerciseInsightHandle: {
    width: 52,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  exerciseInsightHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  exerciseInsightContent: {
    gap: 16,
    paddingBottom: 6,
    flexShrink: 1,
  },
  exerciseInsightSectionCard: {
    backgroundColor: theme.panel,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    gap: 12,
  },
  programStartButton: {
    borderRadius: 20,
    backgroundColor: theme.accent,
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  programStartButtonText: {
    color: theme.accentTextDark,
    fontSize: 18,
    fontWeight: "900",
  },
  programStartButtonChevron: {
    color: theme.accentTextDark,
    fontSize: 24,
    fontWeight: "700",
    marginTop: -1,
  },
  programOptionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
    marginBottom: 16,
  },
  programSectionInlineHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  programSplitRowWithAction: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 16,
  },
  programSplitDropdownWrap: {
    flex: 1,
    gap: 8,
  },
  programSplitDropdownButton: {
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    backgroundColor: "rgba(0,255,153,0.055)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  programSplitDropdownLabel: {
    color: theme.textMuted,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  programSplitDropdownValue: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },
  programSplitDropdownMenu: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panelAlt,
    overflow: "hidden",
  },
  programSplitDropdownOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  programSplitDropdownOptionActive: {
    backgroundColor: theme.accentSoft,
  },
  programSplitDropdownOptionText: {
    color: theme.textSubtle,
    fontSize: 14,
    fontWeight: "800",
  },
  programSplitDropdownOptionTextActive: {
    color: theme.accent,
  },
  programSplitChipScroller: {
    flex: 1,
  },
  programAddSplitButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginTop: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,255,153,0.1)",
    borderWidth: 1,
    borderColor: theme.accentBorder,
  },
  programAddSplitButtonText: {
    color: theme.accent,
    fontSize: 22,
    fontWeight: "800",
    marginTop: -2,
  },
  splitManagementMenuCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panelAlt,
    padding: 8,
    gap: 4,
    marginTop: -6,
    marginBottom: 16,
  },
  presetToggleButton: {
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.panelAlt,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  presetToggleButtonActive: {
    borderColor: theme.accentBorder,
    backgroundColor: theme.accentSoft,
  },
  presetToggleButtonText: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  presetToggleButtonTextActive: {
    color: theme.accent,
  },
  programSplitChipRow: {
    gap: 10,
    paddingBottom: 4,
    paddingRight: 4,
  },
  programPreviewStack: {
    gap: 10,
    marginTop: 10,
    marginBottom: 16,
  },
  programPreviewHint: {
    color: theme.textMuted,
    fontSize: 13,
    marginTop: 6,
    marginBottom: 12,
  },
  programPreviewBoard: {
    width: "100%",
    position: "relative",
    marginBottom: 16,
  },
  programPreviewHorizontalRow: {
    gap: 12,
    paddingRight: 6,
    marginBottom: 16,
  },
  programPreviewBlock: {
    position: "absolute",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.panelAlt,
    paddingHorizontal: 10,
    paddingVertical: 12,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    overflow: "hidden",
  },
  programPreviewBlockTraining: {
    backgroundColor: "rgba(12, 23, 19, 0.98)",
    borderColor: theme.accentBorder,
  },
  programPreviewBlockRest: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  programPreviewBlockPressed: {
    borderColor: theme.accent,
    backgroundColor: "rgba(0,255,153,0.12)",
    transform: [{ scale: 0.98 }],
  },
  programPreviewBlockDragging: {
    borderColor: theme.accent,
    shadowColor: theme.accent,
    shadowOpacity: 0.26,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    transform: [{ scale: 1.04 }],
    zIndex: 30,
  },
  programPreviewBlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    minHeight: 24,
  },
  programPreviewMenuButton: {
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.9,
  },
  programPreviewMenuButtonText: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  programPreviewDragSurface: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: 8,
  },
  programPreviewBlockOrder: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  programPreviewBlockLabel: {
    color: theme.text,
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 15,
    textAlign: "center",
  },
  programPreviewBlockMeta: {
    color: theme.textMuted,
    fontSize: 10,
    lineHeight: 12,
    minHeight: 24,
  },
  programPreviewGrip: {
    color: theme.accent,
    fontSize: 16,
    lineHeight: 16,
    letterSpacing: 0.2,
    fontWeight: "700",
    opacity: 0.84,
  },
  splitCellMenuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.58)",
    justifyContent: "flex-end",
    padding: 18,
  },
  splitCellMenuSheet: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.panel,
    padding: 18,
    gap: 14,
  },
  splitCellMenuTitle: {
    color: theme.text,
    fontSize: 24,
    fontWeight: "900",
  },
  splitCellMenuOptions: {
    gap: 10,
  },
  splitCellMenuOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panelAlt,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  splitCellMenuOptionSelected: {
    borderColor: theme.accent,
    backgroundColor: "rgba(0,255,153,0.1)",
  },
  splitCellMenuOptionText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "800",
  },
  splitCellMenuOptionTextSelected: {
    color: theme.accent,
  },
  splitCellMenuCheck: {
    color: theme.accent,
    fontSize: 18,
    fontWeight: "900",
  },
  programPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
    backgroundColor: theme.panelAlt,
  },
  programPreviewDay: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "800",
  },
  programPreviewLabel: {
    color: theme.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  programReorderRow: {
    flexDirection: "row",
    gap: 8,
  },
  programMiniArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  programMiniArrowText: {
    color: theme.text,
    fontSize: 22,
    marginTop: -2,
  },
  programCustomDayCard: {
    gap: 12,
    marginTop: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panelAlt,
    padding: 16,
  },
  customSplitContent: {
    paddingTop: 12,
  },
  customSplitPreviewStack: {
    gap: 8,
    marginBottom: 18,
  },
  customSplitPreviewRow: {
    flexDirection: "row",
    gap: 8,
  },
  customSplitPreviewCell: {
    flex: 1,
    minHeight: 74,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "space-between",
  },
  customSplitPreviewCellTraining: {
    borderColor: theme.accentBorder,
    backgroundColor: "rgba(0,255,153,0.08)",
  },
  customSplitPreviewCellRest: {
    borderColor: theme.border,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  customSplitPreviewCellLabel: {
    color: theme.text,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "800",
    textAlign: "center",
    minHeight: 28,
  },
  customSplitPreviewCellDay: {
    color: theme.textMuted,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    textAlign: "center",
    width: "100%",
  },
  customSplitSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  customSplitSectionMeta: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  customSplitLengthSelectorRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  customSplitLengthPill: {
    flex: 1,
    minHeight: 42,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panel,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  customSplitLengthPillActive: {
    borderColor: theme.accent,
    backgroundColor: "rgba(0,255,153,0.12)",
  },
  customSplitLengthPillText: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: "800",
  },
  customSplitLengthPillTextActive: {
    color: theme.accent,
  },
  customSplitDayList: {
    gap: 10,
    marginBottom: 18,
  },
  customSplitDayListRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panelAlt,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  customSplitDayListInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  customSplitDayListTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "800",
  },
  customSplitDayListValue: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  customSplitDayListValueRest: {
    color: theme.textMuted,
  },
  customSplitDayAddButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,255,153,0.1)",
    borderWidth: 1,
    borderColor: theme.accentBorder,
  },
  customSplitDayAddButtonText: {
    color: theme.accent,
    fontSize: 22,
    fontWeight: "800",
    marginTop: -2,
  },
  customSplitActionSheet: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.panel,
    padding: 18,
    gap: 12,
  },
  customSplitActionSheetTitle: {
    color: theme.text,
    fontSize: 22,
    fontWeight: "900",
  },
  customSplitActionSheetSubtitle: {
    color: theme.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  customSplitActionOption: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panelAlt,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  customSplitActionOptionRest: {
    borderColor: "rgba(255,255,255,0.08)",
  },
  customSplitActionOptionText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "800",
  },
  customSplitSavedWorkoutList: {
    maxHeight: 340,
  },
  customSplitSavedWorkoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panelAlt,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 10,
  },
  customSplitSavedWorkoutRowTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "800",
  },
  customSplitSavedWorkoutRowMeta: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  customSplitSavedWorkoutRowChevron: {
    color: theme.accent,
    fontSize: 20,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.52)",
    justifyContent: "flex-start",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  programTemplateChipRow: {
    gap: 10,
    paddingRight: 4,
  },
  programCustomPreviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  programCustomPreviewRow: {
    flexDirection: "row",
    gap: 8,
  },
  programCustomPreviewCell: {
    width: "23%",
    minHeight: 68,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: "space-between",
  },
  programCustomPreviewCellTraining: {
    borderColor: theme.accentBorder,
    backgroundColor: "rgba(0,255,153,0.08)",
  },
  programCustomPreviewCellRest: {
    borderColor: theme.border,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  programCustomPreviewCellDay: {
    color: theme.textMuted,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  programCustomPreviewCellLabel: {
    color: theme.text,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "800",
  },
  programCustomDayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "space-between",
  },
  programCustomDayName: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },
  programMuscleChipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  programOptionRowCompact: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
  },
  programDayActionButton: {
    flex: 1,
    minWidth: 150,
  },
  programRestToggleButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.panel,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  programRestToggleButtonActive: {
    borderColor: theme.accentBorder,
    backgroundColor: "rgba(0,255,153,0.08)",
  },
  programRestToggleButtonText: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  programRestToggleButtonTextActive: {
    color: theme.accent,
  },
  programExerciseSuggestionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  programExerciseSuggestionCard: {
    width: "48%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panel,
    padding: 12,
    gap: 8,
  },
  programExerciseSuggestionCardActive: {
    borderColor: theme.accent,
    backgroundColor: "rgba(0,255,153,0.09)",
  },
  programExerciseSuggestionName: {
    color: theme.text,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  programExerciseSuggestionNameActive: {
    color: theme.accent,
  },
  programExerciseSuggestionMeta: {
    color: theme.textMuted,
    fontSize: 11,
    lineHeight: 14,
  },
  programTemplateChoiceStack: {
    gap: 10,
  },
  programTemplateChoiceCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panel,
    padding: 14,
    gap: 6,
  },
  programTemplateChoiceCardActive: {
    borderColor: theme.accent,
    backgroundColor: "rgba(0,255,153,0.08)",
  },
  programTemplateChoiceName: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "800",
  },
  programTemplateChoiceNameActive: {
    color: theme.accent,
  },
  programTemplateChoiceMeta: {
    color: theme.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  programTemplatePickerRow: {
    gap: 10,
    paddingRight: 4,
  },
  programTemplatePickerChip: {
    width: 140,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panel,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  programTemplatePickerChipActive: {
    borderColor: theme.accent,
    backgroundColor: "rgba(0,255,153,0.08)",
  },
  programTemplatePickerChipName: {
    color: theme.text,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 17,
  },
  programTemplatePickerChipNameActive: {
    color: theme.accent,
  },
  programTemplatePickerChipMeta: {
    color: theme.textMuted,
    fontSize: 11,
    lineHeight: 14,
  },
  programTemplatePickerChipMetaActive: {
    color: "rgba(225,255,245,0.82)",
  },
  programTemplateBuilderList: {
    gap: 10,
    paddingBottom: 8,
  },
  dashboardHistoryCard: {
    backgroundColor: "#0b0f0d",
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 12,
  },
  dashboardHistoryTitle: {
    color: theme.text,
    fontSize: 24,
    fontWeight: "900",
  },
  dashboardHistorySubtle: {
    color: theme.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  dashboardHistoryWorkoutCard: {
    backgroundColor: theme.panelAlt,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    gap: 8,
  },
  dashboardHistoryEmpty: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
  },
  dashboardPanelCard: {
    width: "88%",
    backgroundColor: theme.panel,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 18,
    gap: 12,
  },
  settingsContent: {
    paddingTop: 2,
    paddingBottom: 120,
    gap: 14,
  },
  settingsHeroCard: {
    backgroundColor: "#0b0f0d",
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 8,
  },
  settingsOptionStack: {
    gap: 12,
  },
  settingsOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panel,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingsOptionBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsOptionBadgeText: {
    color: theme.accent,
    fontSize: 18,
    fontWeight: "900",
  },
  settingsOptionCopy: {
    flex: 1,
    gap: 4,
  },
  settingsOptionTitle: {
    color: theme.text,
    fontSize: 17,
    fontWeight: "800",
  },
  settingsOptionSubtitle: {
    color: theme.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  settingsOptionChevron: {
    color: theme.accent,
    fontSize: 20,
    fontWeight: "800",
  },
  settingsPlaceholderCard: {
    backgroundColor: "#0b0f0d",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 18,
    gap: 10,
  },
  profileFormCard: {
    backgroundColor: "#0b0f0d",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 18,
    gap: 16,
  },
  profileHeroCard: {
    backgroundColor: "#0b0f0d",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  profileHeaderEditButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    backgroundColor: theme.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.accentSoft,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  profileAvatarImage: {
    width: "100%",
    height: "100%",
  },
  profileAvatarText: {
    color: theme.accent,
    fontSize: 24,
    fontWeight: "900",
  },
  profileMetricGrid: {
    flexDirection: "row",
    gap: 10,
  },
  profileMetricCard: {
    flex: 1,
    width: undefined,
  },
  progressStatsHeroCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    backgroundColor: "#0b0f0d",
    padding: 16,
    gap: 12,
  },
  progressStatsSection: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panel,
    padding: 14,
    gap: 10,
  },
  progressStatsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  progressStatsSeeAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  progressStatsSeeAllText: {
    color: theme.accent,
    fontSize: 12,
    fontWeight: "800",
  },
  progressStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  progressStatsCard: {
    flexGrow: 1,
    flexBasis: "47%",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.panelAlt,
    padding: 14,
    gap: 8,
  },
  progressStatsValue: {
    color: theme.accent,
    fontSize: 28,
    fontWeight: "900",
  },
  progressStatsMiniCard: {
    flexGrow: 1,
    flexBasis: "45%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 12,
    gap: 5,
  },
  progressStatsMiniLabel: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  progressStatsMiniValue: {
    color: theme.text,
    fontSize: 17,
    fontWeight: "900",
  },
  progressStatsMiniSubtext: {
    color: theme.textMuted,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  progressStatsRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(255,255,255,0.025)",
    padding: 12,
    gap: 4,
  },
  progressStatsCheckInRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressStatsCheckInThumb: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: theme.panelRaised,
  },
  progressStatsCheckInThumbPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  progressStatsCheckInThumbPlaceholderText: {
    color: theme.textMuted,
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  progressStatsRowTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "800",
  },
  progressStatsRowMeta: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  profileField: {
    gap: 8,
  },
  heightCounterRow: {
    flexDirection: "row",
    gap: 12,
  },
  heightCounterCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.field,
    padding: 12,
    alignItems: "center",
    gap: 6,
  },
  heightCounterButton: {
    width: "100%",
    height: 32,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    backgroundColor: theme.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  heightCounterButtonText: {
    color: theme.accent,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 18,
  },
  heightCounterValue: {
    color: theme.text,
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 40,
  },
  heightCounterLabel: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  heightCounterSummary: {
    alignSelf: "flex-start",
    color: theme.accent,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },
  profilePhotoPicker: {
    minHeight: 72,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.field,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profilePhotoPickerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    backgroundColor: theme.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  profilePhotoPickerImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  profilePhotoPickerTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "800",
  },
  profilePhotoPickerSubtitle: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  profileSexRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  profileSexChip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.field,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  profileSexChipActive: {
    borderColor: theme.accentBorder,
    backgroundColor: theme.accentSoft,
  },
  profileSexChipText: {
    color: theme.textSubtle,
    fontSize: 13,
    fontWeight: "700",
  },
  profileSexChipTextActive: {
    color: theme.accent,
  },
  profileSaveState: {
    color: theme.accent,
    fontSize: 13,
    fontWeight: "700",
  },
  staticInfoPill: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.field,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  staticInfoText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "700",
  },
  checkInPhotoRow: {
    gap: 12,
  },
  checkInPhotoCard: {
    position: "relative",
    width: 112,
    height: 112,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.panelAlt,
  },
  checkInPhotoImage: {
    width: "100%",
    height: "100%",
  },
  checkInPhotoRemove: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(4,9,7,0.78)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkInPhotoRemoveText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
  },
  progressGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  progressCard: {
    width: "47%",
    minWidth: 150,
    backgroundColor: theme.panel,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 8,
  },
  progressLabel: {
    color: theme.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  progressValue: {
    color: theme.text,
    fontSize: 22,
    fontWeight: "800",
  },
  mealList: {
    gap: 12,
  },
  mealCard: {
    backgroundColor: theme.panelAlt,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 10,
  },
  mealHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  mealTitle: {
    color: theme.text,
    fontSize: 20,
    fontWeight: "800",
  },
  mealSubtitle: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  inlineAddButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: theme.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  activeWorkoutAddExerciseButton: {
    minWidth: 170,
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: theme.accent,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  workoutStartPrimaryButton: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: theme.accent,
  },
  workoutPrimaryButtonText: {
    color: theme.accentTextDark,
    fontWeight: "900",
    fontSize: 15,
  },
  inlineAddButtonText: {
    color: theme.accentTextDark,
    fontWeight: "800",
    fontSize: 14,
  },
  mealEntry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: theme.panelRaised,
  },
  mealEntryTitle: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "700",
  },
  mealEntryMeta: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  mealEntryCalories: {
    color: theme.text,
    fontWeight: "800",
    fontSize: 13,
  },
  removeText: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  removeIconButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  removeIconButtonPressed: {
    backgroundColor: "rgba(208, 59, 59, 0.08)",
  },
  removeIconImage: {
    width: 16,
    height: 16,
  },
  emptyState: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
  },
  emptyStateText: {
    color: theme.textMuted,
  },
  workoutStartCard: {
    backgroundColor: theme.panel,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 8,
  },
  workoutQuickStartCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 16,
  },
  workoutStartTitle: {
    color: theme.text,
    fontSize: 22,
    fontWeight: "800",
  },
  workoutQuickStartTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "800",
  },
  workoutQuickStartMeta: {
    color: theme.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  workoutQuickStartButton: {
    minWidth: 84,
  },
  workoutStartBody: {
    color: theme.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  savedWorkoutHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  secondaryPillButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.panelAlt,
  },
  secondaryPillButtonText: {
    color: theme.textSubtle,
    fontWeight: "800",
    fontSize: 12,
  },
  savedWorkoutCard: {
    backgroundColor: theme.panelAlt,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
    gap: 8,
  },
  todayWorkoutHeroCard: {
    borderColor: theme.accentBorder,
    backgroundColor: "rgba(7, 18, 14, 0.98)",
    shadowColor: theme.accent,
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
    padding: 18,
    gap: 12,
  },
  todayWorkoutHeroTitle: {
    color: theme.text,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 31,
  },
  todayWorkoutHeroMeta: {
    color: theme.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  savedWorkoutCardExpanded: {
    borderColor: theme.accentBorder,
  },
  savedWorkoutsToggleButton: {
    marginTop: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.panelRaised,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  savedWorkoutsToggleText: {
    color: theme.accent,
    fontSize: 13,
    fontWeight: "800",
  },
  savedWorkoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  savedWorkoutActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  savedWorkoutExpandIcon: {
    color: theme.accent,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 20,
  },
  savedWorkoutTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "800",
  },
  savedWorkoutMeta: {
    color: theme.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  savedWorkoutAction: {
    color: theme.accent,
    fontWeight: "800",
    fontSize: 13,
  },
  savedWorkoutFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 2,
  },
  savedWorkoutExerciseSection: {
    gap: 10,
  },
  savedWorkoutExerciseToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.02)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  exerciseTogglePrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  exerciseToggleActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  exerciseToggleBullet: {
    width: 10,
    height: 10,
  },
  savedWorkoutAccessoryButton: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.panelRaised,
  },
  savedWorkoutAccessoryButtonText: {
    color: theme.textSubtle,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  savedWorkoutSummary: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  savedWorkoutExerciseList: {
    marginTop: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  savedWorkoutExerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  savedWorkoutExerciseName: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    paddingRight: 12,
  },
  savedWorkoutExerciseMeta: {
    color: theme.accent,
    fontSize: 12,
    fontWeight: "800",
  },
  templateMenuButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  templateMenuButtonText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 15,
    marginTop: -1,
    textAlign: "center",
  },
  templateMenuButtonIcon: {
    width: 20,
    height: 20,
  },
  templateManageButton: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.panelRaised,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  templateManageButtonText: {
    color: theme.textSubtle,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  templateMenuCard: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  templateMenuAction: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.panelRaised,
    minHeight: 44,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  templateMenuActionText: {
    color: theme.textSubtle,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    textAlignVertical: "center",
  },
  templateMenuDeleteText: {
    color: "#ff8f8f",
  },
  templateMenuDeleteIcon: {
    width: 14,
    height: 14,
    tintColor: "#ff8f8f",
    marginBottom: 4,
  },
  workoutFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  workoutFilterPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.panelAlt,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  workoutFilterPillActive: {
    borderColor: theme.accentBorder,
    backgroundColor: theme.accentSoft,
  },
  workoutFilterPillText: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  workoutFilterPillTextActive: {
    color: theme.accent,
  },
  activeWorkoutHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  activeWorkoutMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    flexWrap: "wrap",
  },
  timerPillWrap: {
    borderRadius: 999,
  },
  timerPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: theme.accentSoft,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timerPauseButton: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.panelAlt,
  },
  timerPauseButtonText: {
    color: theme.textSubtle,
    fontSize: 12,
    fontWeight: "800",
  },
  timerIcon: {
    width: 14,
    height: 14,
    tintColor: theme.accent,
  },
  timerPillText: {
    color: theme.accent,
    fontSize: 12,
    fontWeight: "800",
  },
  timerEditorColumns: {
    flexDirection: "row",
    gap: 12,
  },
  timerEditorColumn: {
    flex: 1,
    gap: 8,
  },
  timerNumberList: {
    maxHeight: 188,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panelAlt,
  },
  timerNumberOption: {
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  timerNumberOptionActive: {
    backgroundColor: theme.accentSoft,
  },
  timerNumberText: {
    color: theme.textSubtle,
    fontSize: 15,
    fontWeight: "700",
  },
  timerNumberTextActive: {
    color: theme.accent,
  },
  workoutActionRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 2,
  },
  activeWorkoutContent: {
    paddingBottom: 144,
  },
  activeWorkoutContentKeyboard: {
    paddingBottom: 220,
  },
  workoutExerciseCard: {
    backgroundColor: theme.panel,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 12,
  },
  workoutExerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  workoutExerciseInfoTrigger: {
    flex: 1,
    gap: 4,
  },
  workoutExerciseName: {
    color: theme.text,
    fontSize: 20,
    fontWeight: "800",
  },
  workoutExerciseInfoText: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  historyExerciseInfoTrigger: {
    gap: 4,
  },
  rowDeleteButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.34)",
    backgroundColor: "rgba(255, 107, 107, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowDeleteButtonIcon: {
    width: 15,
    height: 15,
    tintColor: "#ff8f8f",
  },
  rowDeleteButtonText: {
    color: "#ff8f8f",
    fontSize: 12,
    fontWeight: "800",
  },
  setTableHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  setHeaderCell: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  setHeaderIndex: {
    width: 34,
  },
  setHeaderPrev: {
    flex: 1.15,
  },
  setHeaderInput: {
    width: 72,
  },
  setHeaderCheck: {
    width: 44,
  },
  workoutSetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: theme.panelAlt,
  },
  workoutSetRowCompleted: {
    backgroundColor: theme.accentSoft,
  },
  setCellText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "800",
  },
  setTypeButton: {
    width: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  setPrevText: {
    color: theme.textMuted,
    fontSize: 13,
  },
  setInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.panelRaised,
    color: theme.text,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: "700",
  },
  setDeleteButton: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  setDeleteButtonText: {
    color: "#ff8f8f",
    fontSize: 18,
    fontWeight: "700",
  },
  addSetWideButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.panelRaised,
    borderWidth: 1,
    borderColor: theme.borderStrong,
  },
  addSetWideButtonText: {
    color: theme.text,
    fontWeight: "800",
    fontSize: 14,
  },
  finishWorkoutCard: {
    backgroundColor: theme.panel,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 12,
  },
  workoutSummaryCard: {
    width: "92%",
    maxHeight: "82%",
    backgroundColor: theme.panel,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 14,
    alignSelf: "center",
  },
  workoutSummaryContent: {
    gap: 14,
    paddingBottom: 6,
  },
  summaryMetricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryMetricCard: {
    width: "47%",
    backgroundColor: theme.panelAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
    gap: 6,
  },
  summaryMetricLabel: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  summaryMetricValue: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "800",
  },
  summarySection: {
    gap: 10,
  },
  summarySectionTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "800",
  },
  summaryBreakdownRow: {
    backgroundColor: theme.panelAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
  },
  summaryBreakdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  summaryBreakdownMuscle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "700",
  },
  summaryBreakdownPercent: {
    color: theme.accent,
    fontSize: 13,
    fontWeight: "800",
  },
  summaryBreakdownTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: theme.panelRaised,
  },
  summaryBreakdownFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: theme.accent,
  },
  prHighlightCard: {
    backgroundColor: theme.panelAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    gap: 4,
  },
  prHighlightTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "800",
  },
  prHighlightText: {
    color: theme.textSubtle,
    fontSize: 13,
    fontWeight: "700",
  },
  prHighlightSubtle: {
    color: theme.textMuted,
    fontSize: 12,
  },
  modalButtonColumn: {
    gap: 10,
  },
  secondaryButtonWide: {
    borderWidth: 1,
    borderColor: theme.borderStrong,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.panelRaised,
  },
  neutralButtonWide: {
    borderWidth: 1,
    borderColor: "rgba(180, 194, 188, 0.22)",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(180, 194, 188, 0.08)",
  },
  neutralButtonText: {
    color: theme.textSubtle,
    fontWeight: "800",
  },
  ghostButton: {
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostButtonText: {
    color: "#ff7b7b",
    fontWeight: "700",
    fontSize: 13,
  },
  exerciseResultCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panel,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  exerciseResultAction: {
    color: theme.accent,
    fontSize: 13,
    fontWeight: "800",
  },
  historyWorkoutCard: {
    backgroundColor: theme.panelAlt,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    gap: 8,
  },
  historyWorkoutAction: {
    color: theme.accent,
    fontSize: 13,
    fontWeight: "800",
  },
  historyWorkoutSummary: {
    color: theme.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: theme.panelAlt,
  },
  setRowCompleted: {
    backgroundColor: theme.accentSoft,
  },
  setIndex: {
    width: 24,
    color: theme.text,
    fontWeight: "800",
    fontSize: 16,
  },
  setValue: {
    flex: 1,
    color: theme.text,
    fontSize: 14,
    fontWeight: "700",
  },
  setCheck: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.panelRaised,
  },
  setCheckActive: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  setCheckText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "700",
  },
  setCheckTextActive: {
    color: theme.accentTextDark,
  },
  setTypeMenuOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  setTypeMenuSwatch: {
    fontSize: 16,
    lineHeight: 16,
  },
  bottomNav: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 14,
    flexDirection: "row",
    backgroundColor: "rgba(11, 18, 16, 0.88)",
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 22,
    padding: 6,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  bottomNavIndicator: {
    position: "absolute",
    top: 6,
    bottom: 6,
    borderRadius: 16,
    backgroundColor: theme.accentSoft,
    borderWidth: 1,
    borderColor: theme.accentBorder,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 14,
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: "transparent",
  },
  tabButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  tabIcon: {
    fontSize: 16,
    color: theme.textMuted,
  },
  tabIconImage: {
    width: 30,
    height: 30,
    marginBottom: 2,
  },
  tabIconImageActive: {
    tintColor: theme.accent,
    opacity: 1,
  },
  tabIconImageInactive: {
    tintColor: theme.textMuted,
    opacity: 0.92,
  },
  tabButtonText: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  tabButtonTextActive: {
    color: theme.accent,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: theme.bgElevated,
  },
  modalKeyboard: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  modalKeyboardEditFood: {
    paddingTop: 0,
  },
  modalKeyboardFullScreen: {
    paddingTop: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingTop: 10,
    paddingBottom: 0,
    marginBottom: 10,
  },
  modalHeaderRoomy: {
    paddingTop: 14,
  },
  modalTitle: {
    color: theme.text,
    fontSize: 28,
    fontWeight: "800",
  },
  modalCloseButton: {
    borderWidth: 1,
    borderColor: theme.borderStrong,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  modalCloseButtonText: {
    color: theme.textSubtle,
    fontWeight: "700",
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
  },
  tabRowWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterTab: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.panel,
  },
  filterTabActive: {
    backgroundColor: theme.accentSoft,
    borderColor: theme.accentBorder,
  },
  filterTabText: {
    color: theme.textMuted,
    fontWeight: "700",
    fontSize: 13,
    lineHeight: 16,
  },
  filterTabTextActive: {
    color: theme.accent,
  },
  scanButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.field,
    alignItems: "center",
    justifyContent: "center",
  },
  scanButtonIcon: {
    color: theme.accent,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 16,
  },
  barcodeIconWrap: {
    width: 20,
    height: 18,
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "center",
    gap: 1.5,
  },
  barcodeIconBar: {
    backgroundColor: theme.accent,
    borderRadius: 1,
    alignSelf: "center",
  },
  barcodeIconBarThin: {
    width: 1.5,
    height: 14,
  },
  barcodeIconBarMedium: {
    width: 2.5,
    height: 16,
  },
  barcodeIconBarThick: {
    width: 3.5,
    height: 18,
  },
  barcodeIconBarWide: {
    width: 4,
    height: 15,
  },
  addCustomMealButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.field,
    alignItems: "center",
    justifyContent: "center",
  },
  addCustomMealButtonText: {
    color: theme.text,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 22,
  },
  creatorMenuCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panel,
    padding: 10,
    gap: 8,
    marginBottom: 12,
  },
  creatorMenuButton: {
    borderRadius: 14,
    backgroundColor: theme.panelRaised,
    padding: 12,
    gap: 4,
  },
  creatorMenuTitle: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "800",
  },
  creatorMenuText: {
    color: theme.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  searchInput: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    backgroundColor: theme.field,
    color: theme.text,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  searchInputInline: {
    flex: 1,
    marginBottom: 0,
  },
  modalResults: {
    flex: 1,
  },
  modalResultsContent: {
    paddingBottom: 28,
    gap: 10,
  },
  modalResultsContentTight: {
    paddingBottom: 12,
  },
  foodResultCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panel,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  foodResultCopy: {
    flex: 1,
  },
  foodResultName: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "700",
  },
  foodResultMeta: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  foodResultMicroHint: {
    color: theme.accent,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 6,
  },
  foodResultCalories: {
    color: theme.text,
    fontSize: 13,
    fontWeight: "800",
  },
  emptyCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
  },
  emptyCardText: {
    color: theme.textMuted,
  },
  searchStatusCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 6,
  },
  searchStatusProvider: {
    color: theme.accent,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  searchStatusText: {
    color: theme.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  searchStatusError: {
    color: "#ff8b7c",
    fontSize: 12,
    lineHeight: 17,
  },
  selectedFoodCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panel,
    padding: 16,
    gap: 14,
  },
  selectedFoodHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  selectedFoodName: {
    color: theme.text,
    fontSize: 22,
    fontWeight: "800",
  },
  selectedFoodBrand: {
    color: theme.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  favoriteButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "rgba(240, 205, 88, 0.38)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a241e",
  },
  favoriteButtonActive: {
    backgroundColor: "#2a2a14",
  },
  favoriteButtonPressed: {
    backgroundColor: "#212d26",
  },
  favoriteButtonIcon: {
    width: 24,
    height: 24,
  },
  favoriteButtonText: {
    color: "#f0cd58",
    fontSize: 26,
    lineHeight: 28,
  },
  favoriteButtonTextActive: {
    color: "#ffd54f",
  },
  deleteGroupButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.panelRaised,
  },
  deleteGroupButtonActive: {
    backgroundColor: "rgba(208, 59, 59, 0.18)",
    borderColor: "rgba(255, 92, 92, 0.5)",
  },
  deleteGroupButtonPressed: {
    backgroundColor: "rgba(208, 59, 59, 0.12)",
  },
  deleteGroupButtonIcon: {
    width: 19,
    height: 19,
  },
  deleteGroupButtonText: {
    color: "#96a7a0",
    fontSize: 18,
  },
  deleteGroupButtonTextActive: {
    color: "#ff6b6b",
  },
  selectionRow: {
    gap: 12,
  },
  selectionField: {
    gap: 8,
  },
  selectionInput: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    backgroundColor: "#121916",
    color: "#f5fffb",
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 17,
    fontWeight: "700",
  },
  selectionLabel: {
    color: theme.textSubtle,
    fontSize: 13,
    fontWeight: "700",
  },
  chipRow: {
    gap: 8,
  },
  servingChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.panelRaised,
  },
  servingChipActive: {
    backgroundColor: theme.accentSoft,
    borderColor: theme.accentBorder,
  },
  servingChipText: {
    color: theme.textMuted,
    fontWeight: "700",
    fontSize: 12,
  },
  servingChipTextActive: {
    color: theme.accent,
  },
  quantityInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.panelRaised,
    color: theme.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  modalMacroCard: {
    gap: 10,
    borderRadius: 18,
    backgroundColor: theme.panelRaised,
    padding: 14,
  },
  microPreviewCard: {
    gap: 10,
    borderRadius: 18,
    backgroundColor: theme.panelRaised,
    padding: 14,
  },
  microPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  microPreviewTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "800",
  },
  microPreviewToggle: {
    color: theme.accent,
    fontSize: 12,
    fontWeight: "800",
  },
  microChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  microChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.panel,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  microChipLabel: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  microChipValue: {
    color: theme.text,
    fontSize: 12,
    fontWeight: "700",
  },
  expandedMicroList: {
    gap: 8,
  },
  expandedMicroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  expandedMicroLabel: {
    color: theme.textSubtle,
    fontSize: 12,
  },
  expandedMicroValue: {
    color: theme.text,
    fontSize: 12,
    fontWeight: "700",
  },
  modalMacroRow: {
    gap: 5,
  },
  modalMacroCopy: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  modalMacroLabel: {
    color: theme.text,
    fontSize: 13,
    fontWeight: "700",
  },
  modalMacroValue: {
    color: theme.textMuted,
    fontSize: 12,
  },
  modalMacroTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  modalMacroFill: {
    height: "100%",
    borderRadius: 999,
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 10,
  },
  modalBottomActionBar: {
    marginTop: 0,
    paddingTop: 6,
    paddingBottom: 0,
    backgroundColor: theme.bgElevated,
  },
  editFoodBottomActionBar: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  savedWorkoutOverflowWrap: {
    overflow: "hidden",
  },
  modalHeaderSpacer: {
    width: 68,
  },
  templateBuilderButtonRow: {
    marginTop: 8,
  },
  templateBuilderActionButton: {
    minHeight: 54,
    paddingHorizontal: 18,
  },
  templateBuilderActionButtonDisabled: {
    opacity: 0.72,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonDisabled: {
    opacity: 0.55,
  },
  secondaryButtonText: {
    color: theme.textSubtle,
    fontWeight: "800",
  },
  secondaryButtonTextAccent: {
    color: theme.accent,
    fontWeight: "800",
  },
  primaryButton: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.accent,
  },
  primaryButtonWide: {
    flex: 1.35,
    minHeight: 52,
  },
  primaryButtonDisabled: {
    opacity: 0.58,
  },
  primaryButtonText: {
    color: theme.accentTextDark,
    fontWeight: "800",
  },
  scannerBackdrop: {
    flex: 1,
    backgroundColor: theme.overlay,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scannerCard: {
    backgroundColor: theme.panel,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 14,
  },
  scannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scannerTitle: {
    color: theme.text,
    fontSize: 24,
    fontWeight: "800",
  },
  cameraFrame: {
    height: 280,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: theme.bgElevated,
    position: "relative",
  },
  scannerPermissionFrame: {
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 24,
  },
  scannerPermissionText: {
    color: theme.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  scanGuide: {
    position: "absolute",
    left: "12%",
    right: "12%",
    top: "36%",
    height: 88,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(102, 255, 191, 0.72)",
    backgroundColor: "transparent",
  },
  torchButton: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(6, 11, 9, 0.84)",
    borderWidth: 1,
    borderColor: theme.accentBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  torchButtonIcon: {
    color: theme.accent,
    fontSize: 20,
    fontWeight: "800",
  },
  torchButtonImage: {
    width: 26,
    height: 26,
  },
  todayWorkoutCard: {
    gap: 12,
    borderColor: theme.accentBorder,
    backgroundColor: "rgba(10, 20, 16, 0.96)",
    shadowColor: theme.accent,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  scannerHelpText: {
    color: theme.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  scannerBusyText: {
    color: theme.accent,
    fontSize: 13,
    fontWeight: "700",
  },
  customMealSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  manualMacroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  manualMacroField: {
    width: "47%",
    gap: 8,
  },
});

export default RootApp;

