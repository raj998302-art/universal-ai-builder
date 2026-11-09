/**
 * Universal AI Builder — AI Code Generation & Modification Engine
 * Generates production-ready Flutter, Native Android (Kotlin), and Web/React applications.
 */

export interface GeneratedProject {
  name: string;
  type: 'flutter' | 'android' | 'web';
  description: string;
  files: Record<string, string>; // path -> content
}

// ── 1. WEB & REACT APPLICATION GENERATOR ────────────────────────────
export function generateWebsiteProject(prompt: string, customName?: string): GeneratedProject {
  const isEcommerce = /e-?commerce|shop|store|cart|product|buy|sell/i.test(prompt);
  const isPortfolio = /portfolio|resume|showcase|personal|freelance/i.test(prompt);
  const isDashboard = /dashboard|analytics|admin|crm|metrics/i.test(prompt);

  const cleanName = customName || (isEcommerce ? 'modern_ecommerce_store' : isDashboard ? 'saas_analytics_dashboard' : isPortfolio ? 'developer_portfolio' : 'universal_web_app');
  const title = isEcommerce ? 'ApexStore — Modern Commerce' : isDashboard ? 'NexusAnalytics — Cloud Dashboard' : isPortfolio ? 'Alex Morgan — Senior Creative Engineer' : 'Universal AI Web Platform';

  // index.html - Complete standalone interactive web app
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: rgba(22, 30, 49, 0.75);
      --card-border: rgba(255, 255, 255, 0.08);
      --primary: #38bdf8;
      --primary-glow: rgba(56, 189, 248, 0.25);
      --accent: #818cf8;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --success: #34d399;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      overflow-x: hidden;
      line-height: 1.5;
    }
    /* Ambient glow backgrounds */
    .glow-orb {
      position: absolute;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      background: radial-gradient(circle, var(--primary-glow) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }
    .glow-1 { top: -100px; left: -100px; }
    .glow-2 { top: 40%; right: -150px; background: radial-gradient(circle, rgba(129, 140, 248, 0.2) 0%, transparent 70%); }

    /* Header Nav */
    header {
      position: sticky;
      top: 0;
      z-index: 50;
      backdrop-filter: blur(16px);
      background: rgba(9, 13, 22, 0.85);
      border-bottom: 1px solid var(--card-border);
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo {
      font-size: 1.25rem;
      font-weight: 800;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    nav { display: flex; gap: 1.5rem; align-items: center; }
    nav a {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: color 0.2s;
    }
    nav a:hover { color: var(--text); }
    .cart-btn {
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: var(--primary);
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      cursor: pointer;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }
    .cart-btn:hover {
      background: var(--primary);
      color: #090d16;
    }

    /* Container */
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 3rem 1.5rem;
      position: relative;
      z-index: 10;
    }

    /* Hero Section */
    .hero {
      text-align: center;
      padding: 4rem 1rem;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.2);
      color: var(--primary);
      padding: 0.35rem 0.9rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }
    .hero h1 {
      font-size: clamp(2.5rem, 5vw, 4rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.1;
      margin-bottom: 1.25rem;
    }
    .hero h1 span {
      background: linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero p {
      max-width: 650px;
      margin: 0 auto 2rem;
      color: var(--text-muted);
      font-size: 1.15rem;
    }
    .btn-group { display: flex; gap: 1rem; justify-content: center; }
    .btn {
      padding: 0.75rem 1.75rem;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
      border: none;
      font-size: 0.95rem;
    }
    .btn-primary {
      background: linear-gradient(135deg, var(--primary), var(--accent));
      color: #090d16;
      box-shadow: 0 4px 20px var(--primary-glow);
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px var(--primary-glow); }
    .btn-secondary {
      background: var(--card-bg);
      color: var(--text);
      border: 1px solid var(--card-border);
    }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.05); }

    /* Catalog / Feature Grid */
    .section-title {
      font-size: 1.85rem;
      font-weight: 700;
      margin-bottom: 2rem;
      text-align: center;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.75rem;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 1rem;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
    }
    .card:hover {
      transform: translateY(-4px);
      border-color: rgba(56, 189, 248, 0.4);
      box-shadow: 0 12px 30px -10px rgba(0, 0, 0, 0.5);
    }
    .card-img {
      height: 180px;
      background: linear-gradient(135deg, #1e293b, #0f172a);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
    }
    .card-body { padding: 1.5rem; flex: 1; display: flex; flex-direction: column; }
    .card-tag {
      font-size: 0.75rem;
      color: var(--primary);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }
    .card-title { font-size: 1.2rem; font-weight: 700; margin-bottom: 0.5rem; }
    .card-desc { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.25rem; flex: 1; }
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid var(--card-border);
    }
    .card-price { font-size: 1.35rem; font-weight: 800; color: #fff; }
    .add-btn {
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: var(--primary);
      padding: 0.45rem 1rem;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .add-btn:hover { background: var(--primary); color: #090d16; }

    /* Modal / Drawer Cart */
    .drawer {
      position: fixed;
      right: -400px;
      top: 0;
      width: 380px;
      height: 100vh;
      background: #0f172a;
      border-left: 1px solid var(--card-border);
      z-index: 100;
      transition: right 0.3s ease;
      padding: 2rem;
      display: flex;
      flex-direction: column;
    }
    .drawer.open { right: 0; box-shadow: -10px 0 30px rgba(0,0,0,0.7); }
    .drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .close-btn { background: none; border: none; color: #fff; font-size: 1.5rem; cursor: pointer; }
    .cart-items { flex: 1; overflow-y: auto; }
    .cart-item {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--card-border);
    }
    .cart-total {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 2px solid var(--card-border);
      display: flex;
      justify-content: space-between;
      font-size: 1.25rem;
      font-weight: 700;
    }

    footer {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-muted);
      border-top: 1px solid var(--card-border);
      margin-top: 4rem;
      font-size: 0.85rem;
    }
  </style>
</head>
<body>
  <div class="glow-orb glow-1"></div>
  <div class="glow-orb glow-2"></div>

  <header>
    <div class="logo">✦ ${title.split('—')[0].trim()}</div>
    <nav>
      <a href="#features">Explore</a>
      <a href="#catalog">Collection</a>
      <a href="#about">About</a>
      <button class="cart-btn" onclick="toggleCart()">
        🛒 Cart (<span id="cart-count">0</span>)
      </button>
    </nav>
  </header>

  <div class="container">
    <section class="hero">
      <div class="badge">🚀 Engineered with Universal AI Builder</div>
      <h1>Designed for the <span>Next Generation</span> of Digital Experience</h1>
      <p>${prompt.replace(/"/g, '&quot;')}</p>
      <div class="btn-group">
        <button class="btn btn-primary" onclick="document.getElementById('catalog').scrollIntoView({behavior: 'smooth'})">Explore Showcase</button>
        <button class="btn btn-secondary" onclick="alert('Connected via Universal AI Platform')">Learn Architecture</button>
      </div>
    </section>

    <h2 class="section-title" id="catalog">Featured Highlights</h2>
    <div class="grid">
      <div class="card">
        <div class="card-img">💎</div>
        <div class="card-body">
          <div class="card-tag">Premium Edition</div>
          <div class="card-title">Quantum Core X1</div>
          <div class="card-desc">Ultralight titanium engineered interface with reactive responsive states.</div>
          <div class="card-footer">
            <span class="card-price">$299</span>
            <button class="add-btn" onclick="addToCart('Quantum Core X1', 299)">Add Item</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-img">⚡</div>
        <div class="card-body">
          <div class="card-tag">High Performance</div>
          <div class="card-title">Velocity Neural Mesh</div>
          <div class="card-desc">Sub-millisecond latency real-time data sync module with zero server lag.</div>
          <div class="card-footer">
            <span class="card-price">$449</span>
            <button class="add-btn" onclick="addToCart('Velocity Neural Mesh', 449)">Add Item</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-img">🛡️</div>
        <div class="card-body">
          <div class="card-tag">Enterprise Security</div>
          <div class="card-title">Sentinel Zero-Trust</div>
          <div class="card-desc">Post-quantum cryptographic isolation architecture with hardened access policies.</div>
          <div class="card-footer">
            <span class="card-price">$599</span>
            <button class="add-btn" onclick="addToCart('Sentinel Zero-Trust', 599)">Add Item</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Cart Drawer -->
  <div class="drawer" id="cart-drawer">
    <div class="drawer-header">
      <h3>Your Items</h3>
      <button class="close-btn" onclick="toggleCart()">✕</button>
    </div>
    <div class="cart-items" id="cart-items">
      <p style="color: var(--text-muted); text-align: center; margin-top: 2rem;">Cart is currently empty.</p>
    </div>
    <div class="cart-total">
      <span>Total</span>
      <span id="cart-total">$0</span>
    </div>
    <button class="btn btn-primary" style="margin-top: 1rem;" onclick="checkout()">Proceed to Checkout</button>
  </div>

  <footer>
    <p>© 2026 ${title.split('—')[0].trim()} · Generated autonomously via Universal AI App & Website Builder</p>
  </footer>

  <script>
    let cart = [];
    function toggleCart() {
      document.getElementById('cart-drawer').classList.toggle('open');
    }
    function addToCart(title, price) {
      cart.push({ title, price });
      updateCartUI();
      toggleCart();
    }
    function updateCartUI() {
      document.getElementById('cart-count').innerText = cart.length;
      const itemsContainer = document.getElementById('cart-items');
      if (cart.length === 0) {
        itemsContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center; margin-top: 2rem;">Cart is currently empty.</p>';
        document.getElementById('cart-total').innerText = '$0';
        return;
      }
      let html = '';
      let total = 0;
      cart.forEach((item, idx) => {
        total += item.price;
        html += '<div class="cart-item"><span>' + item.title + '</span><b>$' + item.price + '</b></div>';
      });
      itemsContainer.innerHTML = html;
      document.getElementById('cart-total').innerText = '$' + total;
    }
    function checkout() {
      if (cart.length === 0) return alert('Your cart is empty.');
      alert('Order placed successfully! Total: ' + document.getElementById('cart-total').innerText);
      cart = [];
      updateCartUI();
      toggleCart();
    }
  </script>
</body>
</html>`;

  // package.json for npm build compatibility
  const packageJson = JSON.stringify({
    name: cleanName.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
    version: '1.0.0',
    private: true,
    scripts: {
      build: 'mkdir -p dist && cp index.html dist/index.html && cp README.md dist/ 2>/dev/null || true',
    },
    dependencies: {},
  }, null, 2);

  const readmeMd = `# ${title}

Generated automatically by **Universal AI App & Website Builder**.

## Prompt
> "${prompt}"

## Structure
- \`index.html\`: Standalone modern reactive application with CSS design system and JavaScript state management.
- \`package.json\`: Production build config packaging assets into \`dist/\`.

## Preview & Deployment
- Live interactive preview accessible via the Dashboard Preview viewer.
- Compiles into a production deployment ZIP archive.
`;

  return {
    name: cleanName,
    type: 'web',
    description: prompt,
    files: {
      'index.html': indexHtml,
      'package.json': packageJson,
      'README.md': readmeMd,
    },
  };
}

// ── 2. FLUTTER APPLICATION GENERATOR ────────────────────────────────
export function generateFlutterProject(prompt: string, customName?: string): GeneratedProject {
  const cleanName = (customName || 'universal_flutter_app').toLowerCase().replace(/[^a-z0-9_]/g, '_');

  const mainDart = `import 'package:flutter/material.dart';

void main() {
  runApp(const GeneratedFlutterApp());
}

class GeneratedFlutterApp extends StatelessWidget {
  const GeneratedFlutterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Universal AI Flutter',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0284C7),
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFF090D16),
      ),
      home: const HomeScreen(title: 'AI Generated App'),
    );
  }
}

class HomeScreen extends StatefulWidget {
  final String title;
  const HomeScreen({super.key, required this.title});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _counter = 0;
  final List<String> _items = [
    'Cloud Build Automation',
    'Cross-Platform Compilation',
    'Direct APK & AAB Packaging',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        backgroundColor: const Color(0xFF161E31),
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF161E31),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withOpacity(0.08)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Prompt Specification',
                    style: TextStyle(fontSize: 12, color: Color(0xFF38BDF8), fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${prompt.replace(/'/g, "\\'")}',
                    style: const TextStyle(fontSize: 15, color: Colors.white),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Active Features',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: ListView.builder(
                itemCount: _items.length,
                itemBuilder: (context, index) {
                  return Card(
                    color: const Color(0xFF111827),
                    margin: const EdgeInsets.only(bottom: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: Border.all(color: Colors.white.withOpacity(0.05)),
                    ),
                    child: ListTile(
                      leading: const CircleAvatar(
                        backgroundColor: Color(0xFF0284C7),
                        child: Icon(Icons.check, color: Colors.white, size: 18),
                      ),
                      title: Text(_items[index], style: const TextStyle(color: Colors.white)),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => setState(() => _counter++),
        backgroundColor: const Color(0xFF0284C7),
        icon: const Icon(Icons.add),
        label: Text('Action ($_counter)'),
      ),
    );
  }
}
`;

  const pubspecYaml = `name: ${cleanName}
description: Generated Flutter application by Universal AI Builder.
version: 1.0.0+1
environment:
  sdk: ">=3.0.0 <4.0.0"

dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.6

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
`;

  return {
    name: cleanName,
    type: 'flutter',
    description: prompt,
    files: {
      'lib/main.dart': mainDart,
      'pubspec.yaml': pubspecYaml,
    },
  };
}

// ── 3. NATIVE ANDROID (KOTLIN) APPLICATION GENERATOR ────────────────
export function generateNativeAndroidProject(prompt: string, customName?: string): GeneratedProject {
  const cleanName = (customName || 'NativeAndroidApp').replace(/[^a-zA-Z0-9]/g, '');

  const mainActivity = `package com.universalaibuilder.app

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import android.widget.TextView
import android.widget.LinearLayout
import android.graphics.Color
import android.view.Gravity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#090D16"))
            setPadding(48, 48, 48, 48)
        }

        val titleView = TextView(this).apply {
            text = "Universal AI Android App"
            textSize = 24f
            setTextColor(Color.parseColor("#38BDF8"))
            gravity = Gravity.CENTER
        }

        val descView = TextView(this).apply {
            text = "${prompt.replace(/"/g, '\\"')}"
            textSize = 16f
            setTextColor(Color.parseColor("#94A3B8"))
            setPadding(0, 32, 0, 0)
            gravity = Gravity.CENTER
        }

        layout.addView(titleView)
        layout.addView(descView)
        setContentView(layout)
    }
}
`;

  return {
    name: cleanName,
    type: 'android',
    description: prompt,
    files: {
      'app/src/main/java/com/universalaibuilder/app/MainActivity.kt': mainActivity,
    },
  };
}
