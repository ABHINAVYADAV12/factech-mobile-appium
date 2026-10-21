pipeline {
  agent { label 'android-emulator' }

  options {
    disableConcurrentBuilds()
    timestamps()
    timeout(time: 45, unit: 'MINUTES')
  }

  parameters {
    choice(name: 'APP_TARGET', choices: ['resident', 'technician'], description: 'QA application to test')
    choice(name: 'TEST_LANE', choices: ['smoke', 'regression', 'hardware'], description: 'Hardware is manual and physical-device only')
    choice(name: 'DEVICE_TARGET', choices: ['emulator', 'physical'], description: 'Routine CI uses emulator')
    string(name: 'ANDROID_UDID', defaultValue: 'emulator-5554', description: 'Explicit ADB serial; no auto-selection')
    choice(name: 'APP_SOURCE', choices: ['installed', 'apk'], description: 'Installed Play Store beta is the routine path; APK is optional')
    booleanParam(name: 'PLAYSTORE_BETA_CONFIRMED', defaultValue: false, description: 'Required for installed-app runs; confirms this is a beta build configured for the test tenant')
    string(name: 'APP_PATH', defaultValue: '', description: 'Required only for APP_SOURCE=apk: absolute path to a pre-staged QA .e2e APK')
    string(name: 'APK_SOURCE_COMMIT', defaultValue: '', description: 'Required only for APP_SOURCE=apk: full product commit SHA')
    string(name: 'AVD_NAME', defaultValue: 'Pixel_9_Pro', description: 'AVD used by emulator runs')
    string(name: 'TEST_ENV_CREDENTIAL_ID', defaultValue: 'factech-mobile-e2e-env-test', description: 'Jenkins Secret File with test-only credentials')
  }

  environment {
    APP_ENV = 'test'
    ALLOW_MUTATIONS = 'false'
    RUN_HARDWARE_TESTS = "${params.TEST_LANE == 'hardware' ? 'true' : 'false'}"
    TEST_API_BASE_URL = 'https://test.isocietymanager.com'
    APPIUM_HOME = "${WORKSPACE}\\.appium"
  }

  stages {
    stage('Validate request') {
      steps {
        script {
          if (params.APP_SOURCE == 'apk') {
            if (!(params.APK_SOURCE_COMMIT ==~ /[0-9a-fA-F]{40}/)) {
              error('APK_SOURCE_COMMIT must be the full 40-character product commit SHA')
            }
            if (!params.APP_PATH?.trim()) error('APP_PATH is required for APP_SOURCE=apk')
          } else if (!params.PLAYSTORE_BETA_CONFIRMED) {
            error('Installed-app runs require PLAYSTORE_BETA_CONFIRMED=true')
          }
          if (params.TEST_LANE == 'hardware' && params.DEVICE_TARGET != 'physical') {
            error('Hardware lane requires DEVICE_TARGET=physical')
          }
          if (params.TEST_LANE != 'hardware' && params.DEVICE_TARGET == 'physical') {
            error('Physical devices are reserved for the manual hardware lane')
          }
          def sourceLabel = params.APP_SOURCE == 'apk' ? params.APK_SOURCE_COMMIT.take(8) : 'play-beta'
          currentBuild.description = "${params.APP_TARGET} ${params.TEST_LANE} ${sourceLabel}"
        }
      }
    }

    stage('Install framework') {
      steps {
        bat 'npm ci'
        bat 'npm run appium:setup'
        bat 'npm run check'
      }
    }

    stage('Boot emulator') {
      when { expression { params.DEVICE_TARGET == 'emulator' } }
      steps {
        withEnv(["AVD_NAME=${params.AVD_NAME}", "ANDROID_UDID=${params.ANDROID_UDID}"]) {
          bat 'npm run emulator:start'
        }
      }
    }

    stage('Run selected lane') {
      steps {
        script {
          def executeTests = {
            withCredentials([file(credentialsId: params.TEST_ENV_CREDENTIAL_ID, variable: 'MOBILE_ENV_FILE')]) {
              bat '''@echo off
for /f "usebackq tokens=1,* delims==" %%A in ("%MOBILE_ENV_FILE%") do set "%%A=%%B"
npm run doctor
npm run test:%TEST_LANE%
'''
            }
          }
          withEnv([
            "APP_TARGET=${params.APP_TARGET}",
            "TEST_LANE=${params.TEST_LANE}",
            "DEVICE_TARGET=${params.DEVICE_TARGET}",
            "ANDROID_UDID=${params.ANDROID_UDID}",
            "APP_PATH=${params.APP_PATH}",
            "APP_SOURCE=${params.APP_SOURCE}",
            "PLAYSTORE_BETA_CONFIRMED=${params.PLAYSTORE_BETA_CONFIRMED}",
            "AVD_NAME=${params.AVD_NAME}",
          ]) {
            if (params.DEVICE_TARGET == 'physical') {
              lock(resource: "android-device-${params.ANDROID_UDID}", inversePrecedence: true) {
                input message: "Connect ${params.ANDROID_UDID}, display the controlled QR, then continue", ok: 'Run hardware test'
                executeTests()
              }
            } else {
              executeTests()
            }
          }
        }
      }
    }
  }

  post {
    always {
      writeFile file: 'artifacts/app-provenance.txt', text: "application=${params.APP_TARGET}\nsource=${params.APP_SOURCE}\nproductCommit=${params.APK_SOURCE_COMMIT}\napk=${params.APP_PATH}\n"
      junit allowEmptyResults: true, testResults: 'artifacts/junit/*.xml'
      allure includeProperties: false, jdk: '', results: [[path: 'artifacts/allure-results']]
      archiveArtifacts allowEmptyArchive: true, artifacts: 'artifacts/**', fingerprint: true
    }
  }
}
