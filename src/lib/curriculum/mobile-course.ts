// Complete Mobile App Development Mastery Course (React Native & Flutter Zero to Hero)

export const mobileCourse = {
  title: "Mobile App Engineering Mastery (React Native & Flutter)",
  description: "Master cross-platform mobile app development with React Native, Expo, Flutter & Dart. Learn navigation architecture, native device APIs (Camera, Geolocation, SQLite, Biometrics), Push Notifications (FCM/APNs), performance optimization with the Hermes engine, and automated app store deployment with Fastlane and EAS.",
  slug: "mobile-development",
  stream: "mobile",
  imageUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80",
  order: 7,
  modules: [
    {
      title: "Phase 1: React Native Core Architecture & Flexbox Layouts",
      description: "Master React Native core primitives: View, Text, Image, ScrollView, TextInput, StyleSheet, Flexbox layouts, and the New Architecture (Fabric & TurboModules).",
      slug: "phase-1-react-native-core",
      topics: [
        {
          title: "React Native Architecture & Cross-Platform Layouts",
          description: "Learn how the JavaScript engine bridges to native iOS (UIKit/Swift) and Android (View/Kotlin) runtimes, Hermes bytecode compilation, and Flexbox styling.",
          slug: "react-native-architecture-flexbox",
          difficulty: 2,
          prerequisites: [],
          concepts: [
            {
              title: "The React Native New Architecture (Fabric & TurboModules)",
              description: "The legacy async JSON bridge has been replaced by JSI (JavaScript Interface), allowing direct synchronous C++ memory references between JS and native platforms (Fabric renderer and TurboModules)."
            },
            {
              title: "Mobile Flexbox Differences from Web CSS",
              description: "In React Native: `flexDirection` defaults to `'column'` (instead of `'row'`), dimensions are unit-less device-independent points (DIP), and styles are declared via `StyleSheet.create()` for compile-time optimization."
            },
            {
              title: "Hermes JavaScript Engine",
              description: "Hermes compiles JavaScript ahead-of-time (AOT) into optimized bytecode during app build, reducing app download size, memory footprint, and slashing Time to Interactive (TTI) on mobile devices."
            }
          ],
          examples: [
            {
              title: "Responsive Card Component in React Native",
              description: "Creating a responsive card layout with image, badge, and touchable feedback",
              starterCode: `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function ProductCard({ title, price, category }: any) {
    // Write React Native JSX
}`,
              solutionCode: `import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';

interface ProductCardProps {
    title: string;
    price: number;
    category: string;
    onPress: () => void;
}

export function ProductCard({ title, price, category, onPress }: ProductCardProps) {
    return (
        <Pressable 
            onPress={onPress}
            style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed
            ]}
        >
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{category.toUpperCase()}</Text>
            </View>
            <Text style={styles.title} numberOfLines={2}>{title}</Text>
            <Text style={styles.price}>\${price.toFixed(2)}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#1e1e24',
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    cardPressed: {
        opacity: 0.75,
        transform: [{ scale: 0.98 }],
    },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: '#3b82f6',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginBottom: 8,
    },
    badgeText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: '700',
    },
    title: {
        color: '#f3f4f6',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    price: {
        color: '#10b981',
        fontSize: 18,
        fontWeight: '700',
    },
});`,
              expectedOutput: "Cross-platform React Native ProductCard with shadow/elevation styling"
            }
          ],
          exercises: [
            {
              title: "Create a Responsive Profile Header",
              description: "Build a React Native component that displays user avatar, name, and 3-column statistics (Followers, Following, Likes)",
              instructions: "Use Flexbox flexDirection: 'row' with justifyContent: 'space-around' for the stats row.",
              starterCode: `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function ProfileHeader({ name, followers, following, likes }: any) {
    // Return layout
}`,
              solutionCode: `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function ProfileHeader({ name, followers, following, likes }: { name: string; followers: number; following: number; likes: number }) {
    return (
        <View style={styles.container}>
            <Text style={styles.name}>{name}</Text>
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{followers}</Text>
                    <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{following}</Text>
                    <Text style={styles.statLabel}>Following</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{likes}</Text>
                    <Text style={styles.statLabel}>Likes</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, alignItems: 'center' },
    name: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginBottom: 16 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
    statItem: { alignItems: 'center' },
    statNumber: { fontSize: 18, fontWeight: '700', color: '#38bdf8' },
    statLabel: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
});`,
              testCases: "Renders name; Contains 3 stat columns; Uses flexDirection: 'row' for horizontal layout",
              hints: "Use flexDirection: 'row' on statsRow and alignItems: 'center' on statItem.",
              difficulty: 2
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "React Native New Architecture (JSI / Fabric)",
              config: JSON.stringify({
                nodes: [
                  { id: "js", label: "JavaScript / React Code\nHermes AOT Bytecode", x: 80, y: 120 },
                  { id: "jsi", label: "JavaScript Interface (JSI)\nDirect C++ Host Objects", x: 280, y: 120 },
                  { id: "fabric", label: "Fabric Rendering Engine\nSync C++ View Tree", x: 480, y: 120 },
                  { id: "native", label: "Native iOS / Android UI\n60/120 FPS Fluid Animations", x: 680, y: 120 }
                ],
                edges: [
                  { from: "js", to: "jsi", label: "zero serialization" },
                  { from: "jsi", to: "fabric", label: "direct C++ call" },
                  { from: "fabric", to: "native", label: "native primitives" }
                ],
                steps: [
                  { id: "1", activeNodes: ["js", "jsi"], description: "Hermes executes pre-compiled bytecode with direct JSI pointers" },
                  { id: "2", activeNodes: ["jsi", "fabric"], description: "Fabric computes C++ layout via Yoga layout engine synchronously" },
                  { id: "3", activeNodes: ["fabric", "native"], description: "Direct updates committed to native UIView (iOS) and Android View hierarchy" }
                ]
              })
            }
          ],
          lesson: {
            title: "React Native Architecture & Cross-Platform Layouts",
            content: `## React Native Architecture & Core Layouts

### 1. The JSI Revolution
In the old bridge architecture, every interaction was serialized to JSON strings and queued asynchronously, causing dropped frames on fast scrolls. With **JSI & Fabric**, JavaScript holds direct references to C++ native host objects for **synchronous, zero-overhead execution**.

### 2. Platform Specific Code
\`\`\`typescript
import { Platform } from 'react-native';

const fontSize = Platform.select({
  ios: 16,
  android: 14,
  default: 15,
});
\`\`\``,
            explanation: "Master the React Native runtime architecture, styling engine, and cross-platform layouts."
          }
        }
      ]
    },
    {
      title: "Phase 2: Mobile Navigation Architecture & State Management",
      description: "Build scalable mobile navigation with React Navigation (Native Stack, Bottom Tabs, Drawer), deep linking, and lightweight state management with Zustand.",
      slug: "phase-2-navigation-state-management",
      topics: [
        {
          title: "React Navigation 7 & High-Performance State with Zustand",
          description: "Learn Native Stack navigation, nested Tab navigators, passing typed params, deep linking URL schemes, and global state persistence.",
          slug: "react-navigation-zustand-state",
          difficulty: 3,
          prerequisites: [0],
          concepts: [
            {
              title: "Native Stack Navigator (`react-native-screens`)",
              description: "Unlike JS stack navigators that render views inside a container, Native Stack uses native iOS `UINavigationController` and Android `Fragment` controllers, delivering native gestures and smooth transitions."
            },
            {
              title: "Universal Deep Linking Schemes",
              description: "Configuring custom URL schemes (`myapp://products/123`) and Universal Links (`https://myapp.com/products/123`) allows seamless routing from emails and push notifications directly into app screens."
            },
            {
              title: "Mobile State Management with Zustand & MMKV",
              description: "Redux boilerplate is heavy for mobile. Zustand provides minimalist, hook-based stores with zero unnecessary re-renders, persistable directly to disk via ultra-fast native MMKV key-value storage."
            }
          ],
          examples: [
            {
              title: "Zustand Persistent Cart Store with MMKV in React Native",
              description: "Creating a high-performance shopping cart store that persists across app restarts",
              starterCode: `import { create } from 'zustand';

interface CartStore {
    items: { id: string; name: string; qty: number }[];
    addItem: (item: { id: string; name: string }) => void;
}`,
              solutionCode: `import { create } from 'zustand';

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

interface CartState {
    items: CartItem[];
    addItem: (product: { id: string; name: string; price: number }) => void;
    removeItem: (id: string) => void;
    clearCart: () => void;
    totalAmount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    
    addItem: (product) => set((state) => {
        const existing = state.items.find(i => i.id === product.id);
        if (existing) {
            return {
                items: state.items.map(i => 
                    i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
                )
            };
        }
        return { items: [...state.items, { ...product, quantity: 1 }] };
    }),

    removeItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id)
    })),

    clearCart: () => set({ items: [] }),

    totalAmount: () => {
        return get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },
}));`,
              expectedOutput: "Type-safe Zustand mobile store with quantity increment and total amount calculation"
            }
          ],
          exercises: [
            {
              title: "Define Typed React Navigation Param List",
              description: "Create TypeScript types for RootStackParamList including Home (no params) and Details ({ productId: string, source: string })",
              instructions: "Export type RootStackParamList and NativeStackScreenProps helper.",
              starterCode: `// navigation/types.ts
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
    // Define screen routes
};`,
              solutionCode: `import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
    Home: undefined;
    ProductDetails: { productId: string; source: string };
    Checkout: { total: number };
};

export type ProductDetailsProps = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;`,
              testCases: "Home has undefined params; ProductDetails requires productId string; Exports ProductDetailsProps",
              hints: "Define RootStackParamList with key-value pairs for each screen name and its param object.",
              difficulty: 2
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "Mobile Navigation Stack & Deep Link Routing",
              config: JSON.stringify({
                nodes: [
                  { id: "link", label: "Deep Link URL\nmyapp://product/42", x: 80, y: 120 },
                  { id: "root", label: "Root Navigation Tree\nLinkingConfig Parser", x: 280, y: 120 },
                  { id: "tabs", label: "BottomTabNavigator\nShop Tab Active", x: 480, y: 60 },
                  { id: "stack", label: "NativeStackNavigator\nPushes ProductDetailsScreen", x: 680, y: 120 }
                ],
                edges: [
                  { from: "link", to: "root", label: "intercept URL" },
                  { from: "root", to: "tabs", label: "resolve tab" },
                  { from: "tabs", to: "stack", label: "push screen" }
                ],
                steps: [
                  { id: "1", activeNodes: ["link", "root"], description: "Operating system routes deep link URL into React Navigation linking configuration" },
                  { id: "2", activeNodes: ["root", "tabs"], description: "Tab bar switched to correct sub-navigator" },
                  { id: "3", activeNodes: ["tabs", "stack"], description: "Native screen pushed onto stack with native transition animation" }
                ]
              })
            }
          ],
          lesson: {
            title: "React Navigation 7 & High-Performance State with Zustand",
            content: `## Mobile Navigation & State Architecture

### 1. Navigation Hierarchies
- **Bottom Tabs**: Primary app destinations (Feed, Search, Profile).
- **Native Stack**: Detail and flow screens (Checkout, Settings, Details).
- **Modals**: Ephemeral workflows (Login, Filters).

### 2. State Management with Zustand
Zustand gives you clean, atomic state slices without provider wrappers:
\`\`\`typescript
const items = useCartStore(state => state.items);
\`\`\``,
            explanation: "Master typed React Navigation hierarchies and minimalist mobile state management."
          }
        }
      ]
    },
    {
      title: "Phase 3: Native Device APIs, Push Notifications & Offline SQLite",
      description: "Integrate hardware device features: Camera, Geolocation, Biometrics (FaceID/Fingerprint), Firebase Cloud Messaging (FCM), and Offline SQLite databases.",
      slug: "phase-3-native-device-apis",
      topics: [
        {
          title: "Hardware APIs, Push Notifications & Local SQLite Persistence",
          description: "Learn Expo Camera & Location modules, FCM push notifications, handling background notification taps, and offline-first SQLite sync.",
          slug: "hardware-apis-push-sqlite",
          difficulty: 4,
          prerequisites: [0, 1],
          concepts: [
            {
              title: "Push Notification Lifecycle (FCM & APNs)",
              description: "Push notifications pass through Firebase Cloud Messaging (FCM) or Apple Push Notification service (APNs). Handlers must support Foreground (toast), Background (tray), and Killed states with deep link navigation."
            },
            {
              title: "Offline-First Mobile Architecture with SQLite / OP-SQLite",
              description: "Mobile networks are unreliable. An offline-first app writes mutations directly to local SQLite database, displays immediate feedback, and synchronizes queued change-sets when network connectivity resumes."
            },
            {
              title: "Hardware Permission Management",
              description: "Modern iOS and Android enforce strict runtime permission models. Apps must handle 'denied', 'granted', and 'blocked' states gracefully with fallback UI."
            }
          ],
          examples: [
            {
              title: "Offline-First Local SQLite Storage in React Native",
              description: "Initializing SQLite database, executing schema migrations, and querying records",
              starterCode: `import * as SQLite from 'expo-sqlite';

export async function initDatabase() {
    // Open DB and create tables
}`,
              solutionCode: `import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!db) {
        db = await SQLite.openDatabaseAsync('app_local.db');
        await db.execAsync(\`
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY NOT NULL,
                title TEXT NOT NULL,
                content TEXT,
                synced INTEGER DEFAULT 0,
                updated_at INTEGER NOT NULL
            );
        \`);
    }
    return db;
}

export async function insertNote(id: string, title: string, content: string) {
    const database = await getDb();
    await database.runAsync(
        'INSERT OR REPLACE INTO notes (id, title, content, synced, updated_at) VALUES (?, ?, ?, 0, ?)',
        [id, title, content, Date.now()]
    );
}

export async function getUnsyncedNotes() {
    const database = await getDb();
    return await database.getAllAsync('SELECT * FROM notes WHERE synced = 0');
}`,
              expectedOutput: "SQLite initialization with WAL mode and transaction query helpers"
            }
          ],
          exercises: [
            {
              title: "Handle Push Notification Tap Routing",
              description: "Write a React Native hook that listens for background notification taps and navigates to the target screen",
              instructions: "Use Notifications.addNotificationResponseReceivedListener and navigate to response.notification.request.content.data.screen.",
              starterCode: `import * as Notifications from 'expo-notifications';

export function useNotificationObserver(navigation: any) {
    // Listen for notification responses
}`,
              solutionCode: `import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

export function useNotificationObserver(navigation: any) {
    useEffect(() => {
        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            if (data?.screen && data?.id) {
                navigation.navigate(data.screen, { id: data.id });
            }
        });

        return () => subscription.remove();
    }, [navigation]);
}`,
              testCases: "Listens for notification response events; Navigates with parameters; Cleans up subscription on unmount",
              hints: "Call addNotificationResponseReceivedListener and subscription.remove() in cleanup function.",
              difficulty: 3
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "Offline-First Mobile Sync Architecture",
              config: JSON.stringify({
                nodes: [
                  { id: "ui", label: "User Interaction\nCreate / Edit Note", x: 80, y: 120 },
                  { id: "sql", label: "Local SQLite DB\nInstant Write (synced=0)", x: 280, y: 120 },
                  { id: "net", label: "NetInfo Network Check\nIs Online? (Wi-Fi/5G)", x: 480, y: 120 },
                  { id: "cloud", label: "Cloud Backend API\nSync Queue Flushed (synced=1)", x: 680, y: 120 }
                ],
                edges: [
                  { from: "ui", to: "sql", label: "zero latency" },
                  { from: "sql", to: "net", label: "read unsynced" },
                  { from: "net", to: "cloud", label: "batch push" }
                ],
                steps: [
                  { id: "1", activeNodes: ["ui", "sql"], description: "Mutations written immediately to local SQLite database with 0 network latency" },
                  { id: "2", activeNodes: ["sql", "net"], description: "Background sync service checks for active network connectivity" },
                  { id: "3", activeNodes: ["net", "cloud"], description: "Unsynced change queue uploaded to cloud and marked as synced" }
                ]
              })
            }
          ],
          lesson: {
            title: "Hardware APIs, Push Notifications & Local SQLite Persistence",
            content: `## Native Device Capabilities

### 1. SQLite Write-Ahead Logging (WAL)
Always enable \`PRAGMA journal_mode = WAL;\` in SQLite: it allows concurrent reads while writes are occurring without database locks.

### 2. Push Notification Payload Best Practice
\`\`\`json
{
  "to": "device_fcm_token",
  "notification": { "title": "New Order #108", "body": "Your order has shipped!" },
  "data": { "screen": "OrderDetails", "id": "108" }
}
\`\`\``,
            explanation: "Master hardware device APIs, push notification routing, and offline-first SQLite persistence."
          }
        }
      ]
    },
    {
      title: "Phase 4: Flutter Architecture, Widgets & State with Riverpod",
      description: "Master Flutter & Dart: Widget Trees, StatelessWidget vs StatefulWidget, Custom Canvas Painting, and reactive state management with Riverpod.",
      slug: "phase-4-flutter-riverpod",
      topics: [
        {
          title: "Flutter Widget Lifecycle, Layouts & Riverpod 2.0 State",
          description: "Learn Dart 3 syntax, Flutter rendering pipeline (Widget, Element, RenderObject trees), BuildContext, and Riverpod 2.0 code generation.",
          slug: "flutter-widgets-riverpod",
          difficulty: 3,
          prerequisites: [0, 1],
          concepts: [
            {
              title: "The Three Trees Architecture in Flutter",
              description: "Flutter maintains 3 parallel trees: 1. Widget Tree (immutable configuration), 2. Element Tree (instantiated lifecycle nodes), and 3. RenderObject Tree (measures geometry and paints pixels on Skia/Impeller engine)."
            },
            {
              title: "Riverpod 2.0 Compile-Safe State",
              description: "Riverpod eliminates runtime `ProviderNotFoundException` by declaring global, immutable providers that are inspected and resolved at compile time with auto-dispose and family modifiers."
            },
            {
              title: "Custom Canvas Painting with CustomPainter",
              description: "When standard widgets are insufficient, `CustomPainter` provides direct 2D drawing primitives (lines, arcs, beziers, shaders) rendered at 120 FPS by the GPU."
            }
          ],
          examples: [
            {
              title: "Riverpod 2.0 AsyncNotifier for API Data Fetching in Flutter",
              description: "Managing asynchronous network state with automatic loading, data, and error handling",
              starterCode: `import 'package:flutter_riverpod/flutter_riverpod.dart';

// Define Riverpod AsyncNotifier`,
              solutionCode: `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class User {
  final String id;
  final String name;
  User({required this.id, required this.name});
}

// AsyncNotifier provider managing remote API state
final userListProvider = AsyncNotifierProvider<UserListNotifier, List<User>>(() {
  return UserListNotifier();
});

class UserListNotifier extends AsyncNotifier<List<User>> {
  @override
  Future<List<User>> build() async {
    // Simulated network latency
    await Future.delayed(const Duration(seconds: 1));
    return [
      User(id: '1', name: 'Alice Chen'),
      User(id: '2', name: 'Devon Vance'),
    ];
  }

  Future<void> addUser(String name) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final current = state.value ?? [];
      final newUser = User(id: DateTime.now().toString(), name: name);
      return [...current, newUser];
    });
  }
}

class UserListPage extends ConsumerWidget {
  const UserListPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncUsers = ref.watch(userListProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Team Members')),
      body: asyncUsers.when(
        data: (users) => ListView.builder(
          itemCount: users.length,
          itemBuilder: (context, idx) => ListTile(
            title: Text(users[idx].name),
            leading: const Icon(Icons.person),
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: \$err')),
      ),
    );
  }
}`,
              expectedOutput: "Flutter Riverpod AsyncNotifier with .when() pattern matching for UI"
            }
          ],
          exercises: [
            {
              title: "Build a Custom StatelessWidget in Flutter",
              description: "Write a StatBadge Flutter widget displaying an icon, title, and value with consistent Card decoration",
              instructions: "Create class StatBadge extends StatelessWidget accepting IconData icon, String label, String value.",
              starterCode: `import 'package:flutter/material.dart';

class StatBadge extends StatelessWidget {
    // Implement widget
}`,
              solutionCode: `import 'package:flutter/material.dart';

class StatBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const StatBadge({
    super.key,
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 28, color: Theme.of(context).primaryColor),
            const SizedBox(height: 8),
            Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}`,
              testCases: "Extends StatelessWidget; Includes Icon, value, label; Uses rounded Card decoration",
              hints: "Override build(BuildContext context) returning a Card with Column.",
              difficulty: 2
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "Flutter 3 Trees Rendering Pipeline",
              config: JSON.stringify({
                nodes: [
                  { id: "widget", label: "Widget Tree\nImmutable Blueprints", x: 80, y: 120 },
                  { id: "element", label: "Element Tree\nLifecycle State Managers", x: 280, y: 120 },
                  { id: "render", label: "RenderObject Tree\nGeometry & Layout Constraints", x: 480, y: 120 },
                  { id: "skia", label: "Impeller / Skia Engine\nGPU Rasterization (120fps)", x: 680, y: 120 }
                ],
                edges: [
                  { from: "widget", to: "element", label: "createElement()" },
                  { from: "element", to: "render", label: "createRenderObject()" },
                  { from: "render", to: "skia", label: "paint & rasterize" }
                ],
                steps: [
                  { id: "1", activeNodes: ["widget", "element"], description: "Widgets diffed against Element tree to minimize expensive rebuilds" },
                  { id: "2", activeNodes: ["element", "render"], description: "RenderObjects calculate exact pixel boundaries and flex constraints" },
                  { id: "3", activeNodes: ["render", "skia"], description: "Impeller engine compiles draw calls directly to Vulkan / Metal GPU shaders" }
                ]
              })
            }
          ],
          lesson: {
            title: "Flutter Widget Lifecycle, Layouts & Riverpod 2.0 State",
            content: `## Flutter Architecture Deep Dive

### 1. The Rendering Pipeline
Flutter does **not** wrap native iOS/Android UI widgets. It controls every pixel on the screen directly using its own high-performance C++ GPU engine (**Impeller** on iOS, **Vulkan** on Android), guaranteeing 100% visual consistency across operating systems.

### 2. Riverpod 2.0 AsyncValue Pattern
\`\`\`dart
asyncData.when(
  data: (value) => ContentWidget(value),
  loading: () => LoadingSpinner(),
  error: (err, stack) => ErrorDisplay(err),
);
\`\`\``,
            explanation: "Master the Flutter rendering architecture, widget composition, and Riverpod state management."
          }
        }
      ]
    },
    {
      title: "Phase 5: Performance Optimization, Hermes & App Store CI/CD",
      description: "Optimize mobile performance (FlatList virtualization, 60fps animations, memory leaks), and automate App Store & Google Play deployments with Fastlane and EAS.",
      slug: "phase-5-performance-cicd-appstore",
      topics: [
        {
          title: "Mobile Performance Optimization, Fastlane & App Store Release",
          description: "Learn FlatList memory tuning (`getItemLayout`, `windowSize`), Reanimated 3 worklets on UI thread, Fastlane lanes, and EAS Build pipelines.",
          slug: "mobile-performance-fastlane-appstore",
          difficulty: 4,
          prerequisites: [0, 1, 2, 3],
          concepts: [
            {
              title: "FlatList Virtualization & Layout Optimization",
              description: "Un-virtualized lists crash mobile apps with Out-of-Memory (OOM) errors. Configuring `getItemLayout` skips dynamic layout measurement, allowing FlatList to render thousands of items instantly."
            },
            {
              title: "React Native Reanimated 3 Worklets",
              description: "JavaScript runs on a separate thread from the native UI thread. Reanimated worklets compile JS animation math to run directly on the UI thread, achieving silky-smooth 60/120 FPS gestures even if the JS thread is busy."
            },
            {
              title: "Automated Mobile CI/CD with Fastlane",
              description: "Fastlane automates code signing (iOS certificates with `match`, Android Keystores), building release binaries (`.ipa` and `.aab`), and publishing to TestFlight and Google Play Console."
            }
          ],
          examples: [
            {
              title: "Optimized Virtualized FlatList with Fixed Item Layout",
              description: "Tuning FlatList for maximum memory efficiency and 60 FPS scroll performance",
              starterCode: `import React from 'react';
import { FlatList, View, Text } from 'react-native';

export function VirtualizedFeed({ data }: any) {
    // Implement performant FlatList
}`,
              solutionCode: `import React, { useCallback } from 'react';
import { FlatList, View, Text, StyleSheet, ListRenderItem } from 'react-native';

interface PostItem {
    id: string;
    title: string;
    body: string;
}

const ITEM_HEIGHT = 80;

const PostRow = React.memo(({ item }: { item: PostItem }) => (
    <View style={styles.row}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
    </View>
));

export function VirtualizedFeed({ data }: { data: PostItem[] }) {
    const renderItem: ListRenderItem<PostItem> = useCallback(({ item }) => (
        <PostRow item={item} />
    ), []);

    const keyExtractor = useCallback((item: PostItem) => item.id, []);

    // Crucial: Eliminates dynamic layout measurement overhead
    const getItemLayout = useCallback((_: any, index: number) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
    }), []);

    return (
        <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            getItemLayout={getItemLayout}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={10}
            removeClippedSubviews={true}
        />
    );
}

const styles = StyleSheet.create({
    row: {
        height: ITEM_HEIGHT,
        padding: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: '#334155',
        backgroundColor: '#0f172a',
    },
    title: { color: '#f8fafc', fontWeight: 'bold', fontSize: 16 },
    body: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
});`,
              expectedOutput: "Virtualized FlatList with getItemLayout and removeClippedSubviews"
            }
          ],
          exercises: [
            {
              title: "Write a Fastlane iOS TestFlight Deployment Lane",
              description: "Create a Fastfile lane that increments build number, builds the release .ipa, and uploads to TestFlight",
              instructions: "Define lane :beta_ios calling increment_build_number, build_app, and upload_to_testflight.",
              starterCode: `# fastlane/Fastfile
default_platform(:ios)
platform :ios do
  lane :beta_ios do
    # Add lane actions
  end
end`,
              solutionCode: `default_platform(:ios)

platform :ios do
  desc "Push a new beta build to Apple TestFlight"
  lane :beta_ios do
    increment_build_number(
      build_number: ENV["GITHUB_RUN_NUMBER"]
    )
    
    match(type: "appstore", readonly: true)
    
    build_app(
      scheme: "Production",
      export_method: "app-store",
      clean: true
    )
    
    upload_to_testflight(
      skip_waiting_for_build_processing: true
    )
  end
end`,
              testCases: "Increments build number; Runs match for code signing; Builds app with clean: true; Uploads to TestFlight",
              hints: "Use match(type: 'appstore'), build_app(...), and upload_to_testflight(...).",
              difficulty: 4
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "Mobile App Store CI/CD & OTA Update Architecture",
              config: JSON.stringify({
                nodes: [
                  { id: "code", label: "Git Release Tag\nv2.4.0", x: 80, y: 120 },
                  { id: "fastlane", label: "Fastlane & EAS Cloud\nAutomated Sign & Compile", x: 280, y: 120 },
                  { id: "stores", label: "App Store / Google Play\nInternal Test Tracks", x: 480, y: 60 },
                  { id: "ota", label: "EAS Update / CodePush\nInstant JS Bundle OTA (<1s)", x: 480, y: 180 }
                ],
                edges: [
                  { from: "code", to: "fastlane", label: "push tag" },
                  { from: "fastlane", to: "stores", label: "native binaries (.ipa / .aab)" },
                  { from: "fastlane", to: "ota", label: "JS patch" }
                ],
                steps: [
                  { id: "1", activeNodes: ["code", "fastlane"], description: "Release tag triggers automated Fastlane and EAS build pipeline" },
                  { id: "2", activeNodes: ["fastlane", "stores"], description: "Native binaries signed with production certificates and submitted to store tracks" },
                  { id: "3", activeNodes: ["fastlane", "ota"], description: "Over-the-Air updates instantly deliver JavaScript hotfixes without store review" }
                ]
              })
            }
          ],
          lesson: {
            title: "Mobile Performance Optimization, Fastlane & App Store Release",
            content: `## Mobile Production Performance & Release Engineering

### 1. FlatList Performance Cheat Sheet
- **\`getItemLayout\`**: Tells FlatList the exact pixel height of rows in advance so it doesn't have to calculate layout dynamically.
- **\`removeClippedSubviews={true}\`**: Detaches off-screen views from native memory.
- **\`windowSize={5}\`**: Reduces how many screenfuls of views are kept in memory.

### 2. Over-the-Air (OTA) Updates
Store review can take 24–48 hours. By using EAS Update or CodePush, critical bugfixes in JavaScript and asset bundles can be deployed to **millions of users instantly**!`,
            explanation: "Master mobile list virtualization, UI-thread animations, and automated App Store delivery."
          }
        }
      ]
    }
  ]
};
