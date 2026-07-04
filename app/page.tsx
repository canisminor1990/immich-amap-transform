export default function Home() {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://YOUR_DOMAIN.vercel.app";

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", lineHeight: 1.6 }}>
      <h1>Immich Gaode Tile Proxy</h1>

      <h2>Style JSON（推荐）</h2>
      <p>Immich 自定义地图直接填以下 URL，支持亮/暗色与背景色：</p>
      <ul>
        <li>
          亮色：<code>{baseUrl}/api/style?theme=light</code>
        </li>
        <li>
          暗色：<code>{baseUrl}/api/style?theme=dark</code>
        </li>
        <li>
          自定义背景：
          <code>{baseUrl}/api/style?theme=dark&amp;bg=%230d1117</code>
        </li>
      </ul>

      <h2>瓦片代理</h2>
      <pre style={{ background: "#f4f4f4", padding: "1rem", overflow: "auto" }}>
        {`${baseUrl}/api/tile/{z}/{x}/{y}`}
      </pre>
    </main>
  );
}
