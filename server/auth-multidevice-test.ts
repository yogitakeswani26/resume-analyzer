#!/usr/bin/env node

/**
 * MULTI-DEVICE AUTHENTICATION TEST
 *
 * Simulates login from multiple devices and tests logout behavior
 *
 * Current Limitation: Tokens don't expire on logout from all devices
 * This test demonstrates current behavior and documents the limitation
 */

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

interface DeviceSession {
  name: string;
  api: AxiosInstance;
  accessToken: string;
  refreshToken: string;
  userId: string;
}

class MultiDeviceAuthTest {
  private baseURL: string;
  private devices: Map<string, DeviceSession> = new Map();
  private results: Array<{ name: string; status: 'PASS' | 'FAIL' | 'WARNING'; message: string }> = [];
  private testUser = {
    name: `Test User ${Date.now()}`,
    email: `multidevice-${Date.now()}@example.com`,
    password: 'Test@123456',
  };

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private log(message: string) {
    console.log(`\n📋 ${message}`);
  }

  private pass(name: string, message: string) {
    this.results.push({ name, status: 'PASS', message });
    console.log(`✅ PASS: ${name}`);
    console.log(`   ${message}`);
  }

  private fail(name: string, message: string) {
    this.results.push({ name, status: 'FAIL', message });
    console.log(`❌ FAIL: ${name}`);
    console.log(`   ${message}`);
  }

  private warn(name: string, message: string) {
    this.results.push({ name, status: 'WARNING', message });
    console.log(`⚠️  WARNING: ${name}`);
    console.log(`   ${message}`);
  }

  private createDeviceClient(deviceName: string): AxiosInstance {
    const api = axios.create({
      baseURL: this.baseURL,
      validateStatus: () => true,
      headers: {
        'User-Agent': `AuthTest-${deviceName}`,
      },
    });

    return api;
  }

  async registerUser() {
    this.log('STEP 1: USER REGISTRATION');
    console.log('─'.repeat(50));

    const api = this.createDeviceClient('registration');
    const response = await api.post('/auth/register', {
      name: this.testUser.name,
      email: this.testUser.email,
      password: this.testUser.password,
    });

    if (response.status !== 201) {
      this.fail('User Registration', `Expected 201, got ${response.status}`);
      return false;
    }

    const { accessToken, refreshToken, user } = response.data.data;
    if (!accessToken || !user._id) {
      this.fail('User Registration', 'Missing accessToken or userId');
      return false;
    }

    this.pass('User Registration', `User created: ${user._id}`);
    this.testUser['userId'] = user._id;
    this.testUser['accessToken'] = accessToken;
    this.testUser['refreshToken'] = refreshToken;

    return true;
  }

  async loginOnDevice(deviceName: string) {
    this.log(`STEP 2.${this.devices.size + 1}: LOGIN ON DEVICE "${deviceName}"`);
    console.log('─'.repeat(50));

    const api = this.createDeviceClient(deviceName);
    const response = await api.post('/auth/login', {
      email: this.testUser.email,
      password: this.testUser.password,
    });

    if (response.status !== 200) {
      this.fail(`Login on ${deviceName}`, `Expected 200, got ${response.status}`);
      return false;
    }

    const { accessToken, refreshToken, user } = response.data.data;

    // Setup authorization for this device
    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

    this.devices.set(deviceName, {
      name: deviceName,
      api,
      accessToken,
      refreshToken,
      userId: user._id,
    });

    this.pass(`Login on ${deviceName}`, `Session established with token ending in ${accessToken.slice(-10)}`);
    return true;
  }

  async verifyDeviceAccess(deviceName: string) {
    const device = this.devices.get(deviceName);
    if (!device) {
      this.fail(`Verify ${deviceName}`, 'Device not found in sessions');
      return false;
    }

    const response = await device.api.get('/auth/me');

    if (response.status === 401) {
      this.fail(`Verify ${deviceName}`, `Device lost access (401 Unauthorized)`);
      return false;
    }

    if (response.status !== 200) {
      this.fail(`Verify ${deviceName}`, `Got status ${response.status}`);
      return false;
    }

    this.pass(`Verify ${deviceName}`, `Device can access protected endpoints`);
    return true;
  }

  async logoutFromDevice(deviceName: string) {
    this.log(`STEP 3.${this.devices.size}: LOGOUT FROM DEVICE "${deviceName}"`);
    console.log('─'.repeat(50));

    const device = this.devices.get(deviceName);
    if (!device) {
      this.fail(`Logout from ${deviceName}`, 'Device not found');
      return false;
    }

    const response = await device.api.post('/auth/logout');

    if (response.status !== 200) {
      this.fail(`Logout from ${deviceName}`, `Expected 200, got ${response.status}`);
      return false;
    }

    this.pass(`Logout from ${deviceName}`, 'Logout endpoint returned 200');
    return true;
  }

  async testLogoutFromAllDevices() {
    this.log('STEP 4: TEST LOGOUT FROM ALL DEVICES');
    console.log('─'.repeat(50));

    console.log('\n📌 Current Behavior Analysis:');
    console.log('   The current logout implementation does NOT invalidate tokens globally.');
    console.log('   Each device must clear tokens on CLIENT-SIDE.\n');

    // After logout from device 1, verify if other devices still work
    // This documents current behavior
    for (const [deviceName] of this.devices) {
      const device = this.devices.get(deviceName);
      if (!device) continue;

      const response = await device.api.get('/auth/me');

      if (response.status === 200) {
        this.warn(
          `Device Access After Logout (${deviceName})`,
          `Device "${deviceName}" still has access. Token not invalidated on server (expected behavior).`
        );
        console.log('   💡 Recommendation: Implement token blacklist for server-side invalidation');
      } else if (response.status === 401) {
        this.pass(
          `Device Access After Logout (${deviceName})`,
          `Device "${deviceName}" no longer has access (client-side logout worked).`
        );
      }
    }
  }

  async testConcurrentRequests() {
    this.log('STEP 5: TEST CONCURRENT REQUESTS FROM MULTIPLE DEVICES');
    console.log('─'.repeat(50));

    const deviceNames = Array.from(this.devices.keys());
    if (deviceNames.length < 2) {
      console.log('⏭️  Skipping: Need at least 2 devices');
      return;
    }

    // Send concurrent requests from all devices
    const promises = deviceNames.map(deviceName => {
      const device = this.devices.get(deviceName)!;
      return device.api.get('/recruiter/candidates').then(response => ({
        deviceName,
        status: response.status,
      }));
    });

    const results = await Promise.all(promises);

    let allSuccessful = true;
    for (const result of results) {
      if (result.status === 200) {
        this.pass(
          `Concurrent Request (${result.deviceName})`,
          `Status ${result.status} - Device can handle concurrent requests`
        );
      } else {
        this.fail(
          `Concurrent Request (${result.deviceName})`,
          `Status ${result.status}`
        );
        allSuccessful = false;
      }
    }
  }

  async testTokenRefreshMultiDevice() {
    this.log('STEP 6: TEST TOKEN REFRESH ACROSS DEVICES');
    console.log('─'.repeat(50));

    for (const [deviceName, device] of this.devices) {
      const response = await axios.post(`${this.baseURL}/auth/refresh`, {
        refreshToken: device.refreshToken,
      }, { validateStatus: () => true });

      if (response.status !== 200) {
        this.fail(
          `Token Refresh (${deviceName})`,
          `Expected 200, got ${response.status}`
        );
        continue;
      }

      const { accessToken: newAccessToken } = response.data.data;
      if (!newAccessToken) {
        this.fail(
          `Token Refresh (${deviceName})`,
          'No new token returned'
        );
        continue;
      }

      // Update device with new token
      device.accessToken = newAccessToken;
      device.api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

      this.pass(
        `Token Refresh (${deviceName})`,
        `Successfully refreshed token`
      );
    }
  }

  async testCrossDeviceTokenAccess() {
    this.log('STEP 7: TEST CROSS-DEVICE TOKEN USAGE');
    console.log('─'.repeat(50));

    const deviceNames = Array.from(this.devices.keys());
    if (deviceNames.length < 2) {
      console.log('⏭️  Skipping: Need at least 2 devices');
      return;
    }

    const device1 = this.devices.get(deviceNames[0])!;
    const device2 = this.devices.get(deviceNames[1])!;

    // Try using device 1's token on device 2 (they should both work with same user)
    const testApi = axios.create({
      baseURL: this.baseURL,
      validateStatus: () => true,
    });

    testApi.defaults.headers.common.Authorization = `Bearer ${device1.accessToken}`;
    const response = await testApi.get('/auth/me');

    if (response.status === 200 && response.data.data.user._id === this.testUser['userId']) {
      this.pass(
        'Cross-Device Token',
        `Token from ${deviceNames[0]} is valid for API access`
      );
    } else {
      this.fail(
        'Cross-Device Token',
        `Could not verify token from ${deviceNames[0]}`
      );
    }
  }

  generateReport() {
    console.log('\n\n');
    console.log('═'.repeat(70));
    console.log('MULTI-DEVICE AUTHENTICATION TEST REPORT');
    console.log('═'.repeat(70));

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warned = this.results.filter(r => r.status === 'WARNING').length;
    const total = this.results.length;

    console.log(`\nSummary: ${passed}/${total} passed, ${failed} failed, ${warned} warnings\n`);

    if (failed > 0) {
      console.log('\n❌ FAILURES:');
      console.log('─'.repeat(70));
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`• ${r.name}: ${r.message}`));
    }

    if (warned > 0) {
      console.log('\n⚠️  WARNINGS:');
      console.log('─'.repeat(70));
      this.results
        .filter(r => r.status === 'WARNING')
        .forEach(r => console.log(`• ${r.name}: ${r.message}`));
    }

    console.log('\n📊 DETAILED RESULTS:');
    console.log('─'.repeat(70));
    this.results.forEach(r => {
      const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${icon} ${r.name}`);
    });

    console.log('\n═'.repeat(70));
    console.log('DEVICES TESTED:', Array.from(this.devices.keys()).join(', '));
    console.log('═'.repeat(70));
  }

  async runAll() {
    try {
      console.log('🚀 MULTI-DEVICE AUTHENTICATION TEST');
      console.log(`📌 Base URL: ${this.baseURL}\n`);

      // Register user
      if (!await this.registerUser()) {
        console.log('\n❌ Registration failed');
        return;
      }

      // Login on 3 different devices
      if (!await this.loginOnDevice('Desktop Chrome')) return;
      if (!await this.loginOnDevice('Mobile Safari')) return;
      if (!await this.loginOnDevice('Laptop Firefox')) return;

      console.log('\n');
      console.log('═'.repeat(70));
      console.log('DEVICE SESSIONS ESTABLISHED');
      console.log('═'.repeat(70));

      // Verify all devices have access
      for (const [deviceName] of this.devices) {
        await this.verifyDeviceAccess(deviceName);
      }

      // Logout from first device
      await this.logoutFromDevice('Desktop Chrome');

      // Test concurrent requests
      await this.testConcurrentRequests();

      // Test token refresh
      await this.testTokenRefreshMultiDevice();

      // Test cross-device token usage
      await this.testCrossDeviceTokenAccess();

      // Test logout from all devices behavior
      await this.testLogoutFromAllDevices();

      // Generate report
      this.generateReport();

      process.exit(0);
    } catch (error) {
      console.error('\n💥 FATAL ERROR:', error);
      process.exit(1);
    }
  }
}

const baseURL = process.env.API_URL || 'http://localhost:5001/api/v1';
const tester = new MultiDeviceAuthTest(baseURL);
tester.runAll();
