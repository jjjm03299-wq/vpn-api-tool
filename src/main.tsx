import React, { createContext, useContext, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  RouterProvider,
  createRouter,
  Route,
  LoaderFunctionArgs,
  ActionFunctionArgs,
} from "@tanstack/react-router";

// --- VPN Types ---
type Country = {
  code: string; // ISO 2-letter code
  name: string;
  flagUrl: string;
};

type VPNStatus = "disconnected" | "connecting" | "connected";

type VPNContextType = {
  connectedCountry: Country | null;
  status: VPNStatus;
  vpnIp: string | null;
  connect: (countryCode: string) => void;
  disconnect: () => void;
  connectFastest: () => void;
  countries: Country[];
  generateVpnIp: () => string;
};

// --- Countries Data (10 countries with flags) ---
const countries: Country[] = [
  { code: "US", name: "United States", flagUrl: "https://flagcdn.com/us.svg" },
  { code: "DE", name: "Germany", flagUrl: "https://flagcdn.com/de.svg" },
  { code: "FR", name: "France", flagUrl: "https://flagcdn.com/fr.svg" },
  { code: "JP", name: "Japan", flagUrl: "https://flagcdn.com/jp.svg" },
  { code: "GB", name: "United Kingdom", flagUrl: "https://flagcdn.com/gb.svg" },
  { code: "CA", name: "Canada", flagUrl: "https://flagcdn.com/ca.svg" },
  { code: "AU", name: "Australia", flagUrl: "https://flagcdn.com/au.svg" },
  { code: "BR", name: "Brazil", flagUrl: "https://flagcdn.com/br.svg" },
  { code: "IN", name: "India", flagUrl: "https://flagcdn.com/in.svg" },
  { code: "ZA", name: "South Africa", flagUrl: "https://flagcdn.com/za.svg" },
];

// --- VPN Context ---
const VPNContext = createContext<VPNContextType | undefined>(undefined);

const generateRandomIp = (): string => {
  return Array(4)
    .fill(0)
    .map(() => Math.floor(Math.random() * 256))
    .join(".");
};

const VPNProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectedCountry, setConnectedCountry] = useState<Country | null>(null);
  const [status, setStatus] = useState<VPNStatus>("disconnected");
  const [vpnIp, setVpnIp] = useState<string | null>(null);

  const connect = (countryCode: string) => {
    const country = countries.find((c) => c.code === countryCode);
    if (!country) return;
    setStatus("connecting");
    setTimeout(() => {
      setConnectedCountry(country);
      setVpnIp(generateRandomIp());
      setStatus("connected");
    }, 1000); // simulate delay
  };

  const disconnect = () => {
    setStatus("disconnected");
    setConnectedCountry(null);
    setVpnIp(null);
  };

  const connectFastest = () => {
    // Simulate fastest server by picking first country (mock)
    connect(countries[0].code);
  };

  const generateVpnIp = () => generateRandomIp();

  return (
    <VPNContext.Provider
      value={{
        connectedCountry,
        status,
        vpnIp,
        connect,
        disconnect,
        connectFastest,
        countries,
        generateVpnIp,
      }}
    >
      {children}
    </VPNContext.Provider>
  );
};

const useVPN = () => {
  const ctx = useContext(VPNContext);
  if (!ctx) throw new Error("useVPN must be used within VPNProvider");
  return ctx;
};

// --- API Routes ---

// Helper to create JSON response
const jsonResponse = (data: any) =>
  new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });

// Route: /api/countries [GET]
const countriesLoader = () => {
  return jsonResponse({ countries });
};

// Route: /api/vpn/status [GET]
const statusLoader = (_args: LoaderFunctionArgs) => {
  const { status, connectedCountry, vpnIp } = vpnState;
  return jsonResponse({ status, connectedCountry, vpnIp });
};

// Route: /api/vpn/connect [POST]
const connectAction = async (args: ActionFunctionArgs) => {
  const body = await args.request.json();
  const { countryCode } = body;
  vpnState.connect(countryCode);
  return jsonResponse({ message: `Connecting to ${countryCode}` });
};

// Route: /api/vpn/disconnect [POST]
const disconnectAction = () => {
  vpnState.disconnect();
  return jsonResponse({ message: "Disconnected" });
};

// Route: /api/vpn/connect-fastest [POST]
const connectFastestAction = () => {
  vpnState.connectFastest();
  return jsonResponse({ message: "Connecting to fastest server" });
};

// Route: /api/vpn/generate-ip [GET]
const generateIpLoader = () => {
  const ip = vpnState.generateVpnIp();
  return jsonResponse({ ip });
};

// --- VPN State Singleton for API handlers ---
let vpnState: VPNContextType;

// --- React Router Setup ---

const rootRoute = new Route({
  path: "/",
  component: () => <App />,
});

const apiRoute = new Route({
  path: "api",
  children: [
    new Route({
      path: "countries",
      loader: countriesLoader,
    }),
    new Route({
      path: "vpn",
      children: [
        new Route({
          path: "status",
          loader: statusLoader,
        }),
        new Route({
          path: "connect",
          action: connectAction,
        }),
        new Route({
          path: "disconnect",
          action: disconnectAction,
        }),
        new Route({
          path: "connect-fastest",
          action: connectFastestAction,
        }),
        new Route({
          path: "generate-ip",
          loader: generateIpLoader,
        }),
      ],
    }),
  ],
});

const router = createRouter({
  routeTree: rootRoute.addChildren([apiRoute]),
  defaultPreload: "intent",
});

// --- App Component ---
function App() {
  const vpn = useVPN();

  vpnState = vpn; // assign vpn state singleton for API handlers

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1>VPN React API Demo</h1>

      <h2>Countries</h2>
      <ul>
        {vpn.countries.map((c) => (
          <li key={c.code}>
            <img
              src={c.flagUrl}
              alt={`${c.name} flag`}
              width={24}
              height={16}
              style={{ marginRight: 8 }}
            />
            {c.name} ({c.code})
          </li>
        ))}
      </ul>

      <h2>VPN Status</h2>
      <p>Status: {vpn.status}</p>
      <p>
        Connected Country:{" "}
        {vpn.connectedCountry ? vpn.connectedCountry.name : "None"}
      </p>
      <p>VPN IP: {vpn.vpnIp ?? "N/A"}</p>

      <h2>Actions</h2>
      <button onClick={() => vpn.connectFastest()}>Connect Fastest Server</button>
      <button onClick={() => vpn.disconnect()} style={{ marginLeft: 10 }}>
        Disconnect
      </button>

      <h3>Connect to Country</h3>
      {vpn.countries.map((c) => (
        <button
          key={c.code}
          onClick={() => vpn.connect(c.code)}
          style={{ marginRight: 5, marginTop: 5 }}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}

// --- Render ---
ReactDOM.createRoot(document.getElementById("root")!).render(
  <VPNProvider>
    <RouterProvider router={router} />
  </VPNProvider>
);
