import "./App.css";
// import AlgoWallet from './components/MyAlgoWallet/AlgoWallet';
import WalletConnectComp from "./components/WalletConnect/WalletConnectComp";
// import First from "./components/Transaction/First";

function App() {
  return (
    <div className="app">
      {/* <AlgoWallet /> */}
      <WalletConnectComp />
      {/* <First /> */}
    </div>
  );
}

export default App;
