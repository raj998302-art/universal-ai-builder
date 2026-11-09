/**
 * Universal AI Builder — Native Android Application Generator
 * Scaffolds complete Kotlin & Java Android projects with Gradle, manifests,
 * layouts, themes, and activities.
 */

export interface AndroidProjectOptions {
  name?: string;
  packageName?: string;
  language?: 'kotlin' | 'java';
  theme?: 'light' | 'dark' | 'custom';
  backgroundColor?: string; // e.g. "#FFFFFF"
  textColor?: string;       // e.g. "#000000"
  mainText?: string;        // e.g. "Hello World!"
  useJetpackCompose?: boolean;
  permissions?: string[];
  versionCode?: number;
  versionName?: string;
}

export interface GeneratedAndroidProject {
  name: string;
  type: 'android';
  description: string;
  packageName: string;
  language: 'kotlin' | 'java';
  files: Record<string, string>; // path -> content
}

export function generateNativeAndroidApp(
  prompt: string,
  options: AndroidProjectOptions = {}
): GeneratedAndroidProject {
  const isKotlin = options.language !== 'java';
  const cleanName = (options.name || 'UniversalAndroidApp').replace(/[^a-zA-Z0-9]/g, '');
  const packageName = (options.packageName || 'com.universalaibuilder.app').toLowerCase();
  const packagePath = packageName.replace(/\./g, '/');

  // Analyze prompt for custom styling requirements
  const wantsWhiteBg = /white\s+background|bg\s*:\s*white|#ffffff/i.test(prompt);
  const wantsBlackText = /black\s+(text|font|centered)|centered\s+black|#000000/i.test(prompt);
  const wantsHelloWorld = /hello\s+world/i.test(prompt);

  const bgColor = options.backgroundColor || (wantsWhiteBg ? '#FFFFFF' : '#090D16');
  const textColor = options.textColor || (wantsBlackText ? '#000000' : wantsWhiteBg ? '#111827' : '#38BDF8');
  const displayText = options.mainText || (wantsHelloWorld ? 'Hello World!' : 'Universal AI Native Android App');
  const subText = wantsHelloWorld ? '' : prompt.replace(/"/g, '\\"');

  const permissions = options.permissions || [];
  if (/internet|network|api|fetch|http/i.test(prompt)) {
    if (!permissions.includes('android.permission.INTERNET')) {
      permissions.push('android.permission.INTERNET');
    }
  }

  // 1. settings.gradle
  const settingsGradle = `rootProject.name = "${cleanName}"
include ':app'
`;

  // 2. build.gradle (root)
  const rootBuildGradle = `buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.2'
        ${isKotlin ? "classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.22'" : ""}
    }
}
allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
`;

  // 3. gradle.properties
  const gradleProperties = `android.useAndroidX=true
android.enableJetifier=false
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
`;

  // 4. app/build.gradle
  const appBuildGradle = `plugins {
    id 'com.android.application'
    ${isKotlin ? "id 'org.jetbrains.kotlin.android'" : ""}
}

android {
    namespace '${packageName}'
    compileSdk 34

    defaultConfig {
        applicationId "${packageName}"
        minSdk 24
        targetSdk 34
        versionCode ${options.versionCode || 1}
        versionName "${options.versionName || '1.0.0'}"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            debuggable true
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
    ${
      isKotlin
        ? `kotlinOptions {
        jvmTarget = '17'
    }`
        : ''
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
}
`;

  // 5. AndroidManifest.xml
  const permissionsTags = permissions
    .map(p => `    <uses-permission android:name="${p}" />`)
    .join('\n');

  const androidManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

${permissionsTags}

    <application
        android:allowBackup="true"
        android:label="${cleanName}"
        android:supportsRtl="true"
        android:theme="@style/Theme.App">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`;

  // 6. res/values/strings.xml
  const stringsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${cleanName}</string>
    <string name="main_display_text">${displayText}</string>
    <string name="sub_display_text">${subText}</string>
</resources>
`;

  // 7. res/values/colors.xml
  const colorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="primary">#38BDF8</color>
    <color name="primary_dark">#0284C7</color>
    <color name="accent">#818CF8</color>
    <color name="background">${bgColor}</color>
    <color name="text_color">${textColor}</color>
</resources>
`;

  // 8. res/values/themes.xml
  const themesXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.App" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="colorPrimary">@color/primary</item>
        <item name="colorPrimaryDark">@color/primary_dark</item>
        <item name="colorAccent">@color/accent</item>
        <item name="android:windowBackground">@color/background</item>
    </style>
</resources>
`;

  // 9. res/layout/activity_main.xml (Centered Layout)
  const activityMainXml = `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="${bgColor}">

    <TextView
        android:id="@+id/textViewTitle"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="${displayText}"
        android:textColor="${textColor}"
        android:textSize="28sp"
        android:textStyle="bold"
        android:gravity="center"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="parent" />

</androidx.constraintlayout.widget.ConstraintLayout>
`;

  // 10. MainActivity (Kotlin or Java)
  let mainActivityCode: string;
  let mainActivityPath: string;

  if (isKotlin) {
    mainActivityPath = `app/src/main/java/${packagePath}/MainActivity.kt`;
    mainActivityCode = `package ${packageName}

import android.os.Bundle
import android.graphics.Color
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Programmatic layout guaranteeing centered positioning and exact styling
        val rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("${bgColor}"))
            setPadding(48, 48, 48, 48)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.MATCH_PARENT
            )
        }

        val mainTextView = TextView(this).apply {
            text = "${displayText}"
            textSize = 28f
            setTextColor(Color.parseColor("${textColor}"))
            gravity = Gravity.CENTER
        }
        rootLayout.addView(mainTextView)

        ${
          subText
            ? `val subTextView = TextView(this).apply {
            text = "${subText}"
            textSize = 15f
            setTextColor(Color.parseColor("#94A3B8"))
            setPadding(0, 24, 0, 0)
            gravity = Gravity.CENTER
        }
        rootLayout.addView(subTextView)`
            : ''
        }

        setContentView(rootLayout)
    }
}
`;
  } else {
    mainActivityPath = `app/src/main/java/${packagePath}/MainActivity.java`;
    mainActivityCode = `package ${packageName};

import android.os.Bundle;
import android.graphics.Color;
import android.view.Gravity;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout rootLayout = new LinearLayout(this);
        rootLayout.setOrientation(LinearLayout.VERTICAL);
        rootLayout.setGravity(Gravity.CENTER);
        rootLayout.setBackgroundColor(Color.parseColor("${bgColor}"));
        rootLayout.setPadding(48, 48, 48, 48);

        TextView mainTextView = new TextView(this);
        mainTextView.setText("${displayText}");
        mainTextView.setTextSize(28f);
        mainTextView.setTextColor(Color.parseColor("${textColor}"));
        mainTextView.setGravity(Gravity.CENTER);
        rootLayout.addView(mainTextView);

        setContentView(rootLayout);
    }
}
`;
  }

  // 11. README.md
  const readmeMd = `# ${cleanName}

Native Android application engineered by **Universal AI Builder Platform**.

- **Package Name:** \`${packageName}\`
- **Language:** ${isKotlin ? 'Kotlin 1.9.22' : 'Java 17'}
- **Android SDK:** Compile SDK 34, Min SDK 24
- **Prompt:** "${prompt}"
- **Background Color:** \`${bgColor}\`
- **Text Color:** \`${textColor}\`
- **Display Text:** "${displayText}"

## Build Instructions
\`\`\`bash
# Assemble Release APK
./gradlew assembleRelease

# Assemble Release AAB (Android App Bundle)
./gradlew bundleRelease
\`\`\`
`;

  return {
    name: cleanName,
    type: 'android',
    description: prompt,
    packageName,
    language: isKotlin ? 'kotlin' : 'java',
    files: {
      'settings.gradle': settingsGradle,
      'build.gradle': rootBuildGradle,
      'gradle.properties': gradleProperties,
      'app/build.gradle': appBuildGradle,
      'app/src/main/AndroidManifest.xml': androidManifest,
      'app/src/main/res/values/strings.xml': stringsXml,
      'app/src/main/res/values/colors.xml': colorsXml,
      'app/src/main/res/values/themes.xml': themesXml,
      'app/src/main/res/layout/activity_main.xml': activityMainXml,
      [mainActivityPath]: mainActivityCode,
      'README.md': readmeMd,
    },
  };
}
