import React, { useState, useMemo } from "react";

type Country = {
  code: string;
  name: string;
  flagUrl: string;
  latency: number;
};

type VpnStatus = "disconnected" | "connecting" | "connected";

const countries: Country[] = [
  { code: "US", name: "United States", flagUrl: "https://flagcdn.com/us.svg", latency: 42 },
  { code: "CA", name: "Canada", flagUrl: "https://flagcdn.com/ca.svg", latency: 51 },
  { code: "GB", name: "United Kingdom", flagUrl: "https://flagcdn.com/gb.svg", latency: 67 },
  { code: "DE", name: "Germany", flagUrl: "https://flagcdn.com/de.svg", latency: 59 },
  { code: "FR", name: "France", flagUrl: "https://flagcdn.com/fr.svg", latency: 63 },
  { code: "NL", name: "Netherlands", flagUrl: "https://flagcdn.com/nl.svg", latency: 48 },
  { code: "JP", name: "Japan", flagUrl: "https://flagcdn.com/jp.svg", latency: 88 },
  { code: "SG", name: "Singapore", flagUrl: "https://flagcdn.com/sg.svg", latency: 74 },
  { code: "AU", name: "Australia", flagUrl: "https://flagcdn.com/au.svg", latency: 96 },
  { code: "BR", name: "Brazil", flagUrl: "https://flagcdn.com/br.svg", latency: 112 },
];

function generateRandomIp(): string {
  return Array(4)
    .fill(0)
    .map(() => Math.floor(Math.random() * 256))
    .join(".");
}

export default function App() {
  const [status, setStatus] = useState<VpnStatus>("disconnected");
  const [connectedCountry, setConnectedCountry] = useState<Country | null>(null);
  const [vpnIp, setVpnIp] = useState<string | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(countries[0].code);
  const [responseJson, setResponseJson] = useState<object | null>(null);

  const selectedCountry = useMemo(
    () => countries.find((c) => c.code === selectedCountryCode) ?? null,
    [selectedCountryCode]
  );

  const fastestCountry = useMemo(() => {
    return countries.reduce((prev, curr) => (curr.latency < prev.latency ? curr : prev), countries[0]);
  }, []);

  const connectToCountry = (country: Country) => {
    setStatus("connecting");
    setResponseJson({
      method: "POST",
      endpoint: "/api/vpn/connect",
      message: `Connecting to ${country.name}`,
      timestamp: new Date().toISOString(),
    });

    setTimeout(() => {
      const ip = generateRandomIp();
      setConnectedCountry(country);
      setVpnIp(ip);
      setStatus("connected");
      setResponseJson({
        method: "POST",
        endpoint: "/api/vpn/connect",
        message: `Connected to ${country.name}`,
        status: "connected",
        country,
        vpnIp: ip,
        timestamp: new Date().toISOString(),
      });
    }, 1000);
  };

  const disconnectVpn = () => {
    setStatus("disconnected");
    setConnectedCountry(null);
    setVpnIp(null);
    setResponseJson({
      method: "POST",
      endpoint: "/api/vpn/disconnect",
      message: "VPN disconnected",
      status: "disconnected",
      timestamp: new Date().toISOString(),
    });
  };

  const connectFastestServer = () => {
    connectToCountry(fastestCountry);
  };

  const getStatus = () => {
    setResponseJson({
      method: "GET",
      endpoint: "/api/vpn/status",
      status,
      connectedCountry,
      vpnIp,
      timestamp: new Date().toISOString(),
    });
  };

  const getCountries = () => {
    setResponseJson({
      method: "GET",
      endpoint: "/api/vpn/countries",
      countries,
      timestamp: new Date().toISOString(),
    });
  };

  const generateVpnIps = () => {
    const ips = Array.from({ length: 10 }, () => generateRandomIp());
    setResponseJson({
      method: "GET",
      endpoint: "/api/vpn/generate-ip",
      count: 10,
      ips,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif", maxWidth: 900, margin: "auto" }}>
      <h1>VPN API Simulator</h1>

      <section>
        <h2>Countries</h2>
        <select
          value={selectedCountryCode}
          onChange={(e) => setSelectedCountryCode(e.target.value)}
          style={{ padding: 8, fontSize: 16, marginBottom: 10 }}
        >
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name} ({country.code})
            </option>
          ))}
        </select>
      </section>

      <section>
        <h2>VPN Status</h2>
        <p>Status: {status}</p>
        <p>Connected Country: {connectedCountry ? connectedCountry.name : "None"}</p>
        <p>VPN IP: {vpnIp ?? "N/A"}</p>
      </section>

      <section>
        <h2>Actions</h2>
        <button onClick={() => selectedCountry && connectToCountry(selectedCountry)} style={{ marginRight: 10 }}>
          Connect VPN
        </button>
        <button onClick={disconnectVpn} style={{ marginRight: 10 }}>
          Disconnect VPN
        </button>
        <button onClick={connectFastestServer} style={{ marginRight: 10 }}>
          Connect Fastest Server
        </button>
      </section>

      <section>
        <h2>API Endpoints (Simulated)</h2>
        <button onClick={getStatus} style={{ marginRight: 10, marginTop: 10 }}>
          GET /api/vpn/status
        </button>
        <button onClick={getCountries} style={{ marginRight: 10, marginTop: 10 }}>
          GET /api/vpn/countries
        </button>
        <button onClick={generateVpnIps} style={{ marginRight: 10, marginTop: 10 }}>
          GET /api/vpn/generate-ip (10 IPs)
        </button>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2>JSON Response</h2>
        <pre
          style={{
            backgroundColor: "#f4f4f4",
            padding: 15,
            borderRadius: 8,
            maxHeight: 300,
            overflowY: "auto",
          }}
        >
          {responseJson ? JSON.stringify(responseJson, null, 2) : "No response yet."}
        </pre>
      </section>
    </div>
  );
}
