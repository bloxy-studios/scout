import { NotchWidget } from "./components/notch-widget";
import { PreferencesWindow } from "./components/preferences-window";
import { getAppSurface } from "./lib/app-surface";
import "./App.css";

function App() {
  return getAppSurface() === "preferences" ? <PreferencesWindow /> : <NotchWidget />;
}

export default App;
