// Web Bluetooth API Service for Second Skin Sport ESP32-C3
// Service & Characteristic UUIDs matching ESP32 firmware
export const BLE_CONFIG = {
  DEVICE_NAME: 'SecondSkin_ESP32',
  SERVICE_UUID: '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
  SENSOR_CHAR_UUID: 'beb5483e-36e1-4688-b7f5-ea07361b26a8',
  COMMAND_CHAR_UUID: 'd9a4b3c0-0f2b-4e67-9f12-0761a2938472',
};

class BleService {
  constructor() {
    this.device = null;
    this.server = null;
    this.service = null;
    this.sensorChar = null;
    this.commandChar = null;
    this.isConnected = false;
    this.onDataCallbacks = [];
    this.onStatusCallbacks = [];
    this.onWifiStatusCallbacks = [];
    this._handleGattDisconnect = this.handleDisconnect.bind(this);
    this._handleSensorData = this.handleSensorData.bind(this);
    this._handleCommandResponse = this.handleCommandResponse.bind(this);
  }

  isSupported() {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  getDeviceInfo() {
    return {
      isConnected: this.isConnected && Boolean(this.device?.gatt?.connected),
      deviceName: this.device?.name || null,
      deviceId: this.device?.id || null,
    };
  }

  notifyStatus(status, details = {}) {
    this.onStatusCallbacks.forEach((cb) => {
      try {
        cb(status, details);
      } catch (err) {
        console.error('Error in status callback:', err);
      }
    });
  }

  onData(callback) {
    this.onDataCallbacks.push(callback);
    return () => {
      this.onDataCallbacks = this.onDataCallbacks.filter((cb) => cb !== callback);
    };
  }

  onStatus(callback) {
    this.onStatusCallbacks.push(callback);
    return () => {
      this.onStatusCallbacks = this.onStatusCallbacks.filter((cb) => cb !== callback);
    };
  }

  onWifiStatus(callback) {
    this.onWifiStatusCallbacks.push(callback);
    return () => {
      this.onWifiStatusCallbacks = this.onWifiStatusCallbacks.filter((cb) => cb !== callback);
    };
  }

  async connect() {
    if (!this.isSupported()) {
      throw new Error(
        'Trình duyệt của bạn không hỗ trợ Web Bluetooth. Hãy dùng Google Chrome hoặc Microsoft Edge (Windows, Android, macOS).'
      );
    }

    if (this.isConnected && this.device && this.device.gatt?.connected) {
      return {
        deviceName: this.device.name,
        deviceId: this.device.id,
      };
    }

    try {
      this.notifyStatus('connecting', { message: 'Đang mở cửa sổ chọn thiết bị Bluetooth...' });

      // Request device with name or prefix
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { name: BLE_CONFIG.DEVICE_NAME },
          { namePrefix: 'SecondSkin' }
        ],
        optionalServices: [BLE_CONFIG.SERVICE_UUID],
      });

      this.device.removeEventListener('gattserverdisconnected', this._handleGattDisconnect);
      this.device.addEventListener('gattserverdisconnected', this._handleGattDisconnect);

      this.notifyStatus('connecting', { message: `Đang kết nối GATT Server với ${this.device.name}...` });

      // Connect to GATT Server
      this.server = await this.device.gatt.connect();

      this.notifyStatus('connecting', { message: 'Đang tìm kiếm Service SecondSkin Sport...' });
      this.service = await this.server.getPrimaryService(BLE_CONFIG.SERVICE_UUID);

      // Get Sensor Telemetry Characteristic
      this.sensorChar = await this.service.getCharacteristic(BLE_CONFIG.SENSOR_CHAR_UUID);
      await this.sensorChar.startNotifications();
      this.sensorChar.removeEventListener(
        'characteristicvaluechanged',
        this._handleSensorData
      );
      this.sensorChar.addEventListener(
        'characteristicvaluechanged',
        this._handleSensorData
      );

      // Get Command Characteristic (for WiFi Provisioning & Control)
      try {
        this.commandChar = await this.service.getCharacteristic(BLE_CONFIG.COMMAND_CHAR_UUID);
        await this.commandChar.startNotifications();
        this.commandChar.removeEventListener(
          'characteristicvaluechanged',
          this._handleCommandResponse
        );
        this.commandChar.addEventListener(
          'characteristicvaluechanged',
          this._handleCommandResponse
        );
      } catch (cmdErr) {
        console.warn('Command characteristic not found or failed to subscribe:', cmdErr);
      }

      this.isConnected = true;
      this.notifyStatus('connected', {
        deviceName: this.device.name,
        deviceId: this.device.id,
      });

      return {
        deviceName: this.device.name,
        deviceId: this.device.id,
      };
    } catch (error) {
      this.isConnected = false;
      this.notifyStatus('error', { error: error.message });
      throw error;
    }
  }

  handleSensorData(event) {
    try {
      const decoder = new TextDecoder('utf-8');
      const jsonString = decoder.decode(event.target.value);
      const data = JSON.parse(jsonString);

      this.onDataCallbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error('Error dispatching sensor data:', err);
        }
      });
    } catch (parseError) {
      console.warn('Cannot parse BLE sensor packet as JSON:', parseError);
    }
  }

  handleCommandResponse(event) {
    try {
      const decoder = new TextDecoder('utf-8');
      const responseStr = decoder.decode(event.target.value);
      const response = JSON.parse(responseStr);

      this.onWifiStatusCallbacks.forEach((cb) => {
        try {
          cb(response);
        } catch (err) {
          console.error('Error dispatching wifi status:', err);
        }
      });
    } catch (err) {
      console.warn('Cannot parse BLE command response:', err);
    }
  }

  handleDisconnect() {
    this.isConnected = false;
    this.server = null;
    this.sensorChar = null;
    this.commandChar = null;
    this.notifyStatus('disconnected', { message: 'Đã ngắt kết nối với thiết bị ESP32.' });
  }

  async disconnect() {
    try {
      if (this.sensorChar) {
        try {
          this.sensorChar.removeEventListener('characteristicvaluechanged', this._handleSensorData);
          await this.sensorChar.stopNotifications();
        } catch (e) {}
      }
      if (this.commandChar) {
        try {
          this.commandChar.removeEventListener('characteristicvaluechanged', this._handleCommandResponse);
          await this.commandChar.stopNotifications();
        } catch (e) {}
      }
      if (this.device) {
        this.device.removeEventListener('gattserverdisconnected', this._handleGattDisconnect);
        if (this.device.gatt && this.device.gatt.connected) {
          await this.device.gatt.disconnect();
        }
      }
    } catch (e) {
      console.warn('Error during disconnect:', e);
    } finally {
      this.handleDisconnect();
    }
  }

  /**
   * Send Wi-Fi credentials to ESP32 over BLE
   * @param {Object} config - { ssid, pass, backendUrl }
   */
  async sendWifiConfig({ ssid, password, backendUrl = '' }) {
    if (!this.isConnected || !this.commandChar) {
      throw new Error('Chưa kết nối Bluetooth với thiết bị ESP32.');
    }

    const payload = JSON.stringify({
      cmd: 'wifi_config',
      ssid: ssid.trim(),
      pass: password,
      url: backendUrl.trim(),
    });

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(payload);

    await this.commandChar.writeValue(dataBuffer);
    return true;
  }

  /**
   * Send charging mode command to ESP32 over BLE
   * @param {boolean} isCharging
   */
  async sendChargingCommand(isCharging) {
    if (!this.isConnected || !this.commandChar) {
      return false;
    }

    const payload = JSON.stringify({
      cmd: 'set_charging',
      charging: Boolean(isCharging),
    });

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(payload);

    await this.commandChar.writeValue(dataBuffer);
    return true;
  }

  /**
   * Reset session counters (jumpCount, stepCount) on ESP32 hardware
   */
  async sendResetSessionCommand() {
    if (!this.isConnected || !this.commandChar) {
      return false;
    }

    const payload = JSON.stringify({ cmd: 'reset_session' });
    try {
      await this.commandChar.writeValue(new TextEncoder().encode(payload));
      return true;
    } catch (e) {
      console.warn('Could not send reset_session to BLE hardware:', e);
      return false;
    }
  }

  async sendSensorConfig({ samplingRate, calibrate = false }) {
    if (!this.isConnected || !this.commandChar) {
      throw new Error('Chưa kết nối Bluetooth với thiết bị ESP32.');
    }

    const payload = JSON.stringify({
      cmd: calibrate ? 'calibrate_imu' : 'sensor_config',
      sampling_rate_hz: Number.parseInt(String(samplingRate).replace(/[^0-9]/g, ''), 10),
    });
    await this.commandChar.writeValue(new TextEncoder().encode(payload));
    return true;
  }

  /**
   * Send Kinematic Thresholds configuration struct to ESP32 over BLE
   */
  async sendKinematicConfig(config) {
    if (!this.isConnected || !this.commandChar) {
      throw new Error('Chưa kết nối Bluetooth với thiết bị ESP32.');
    }
    const payload = JSON.stringify({
      cmd: 'set_config',
      flt: Number(config.flightThresh ?? 0.40),
      run_imp: Number(config.runImpact ?? 2.00),
      jmp_imp: Number(config.jumpImpact ?? 2.80),
      jmp_air: Number(config.jumpAirtime ?? 220),
      run_ref: Number(config.runRefractory ?? 250),
      jmp_ref: Number(config.jumpRefractory ?? 350),
    });
    await this.commandChar.writeValue(new TextEncoder().encode(payload));
    return true;
  }

  /**
   * Toggle CSV Log Output over Serial on ESP32
   */
  async sendCsvLogCommand(enable = true) {
    if (!this.isConnected || !this.commandChar) return false;
    const payload = JSON.stringify({ cmd: 'csv_log', enable: Boolean(enable) });
    await this.commandChar.writeValue(new TextEncoder().encode(payload));
    return true;
  }

  /**
   * Trigger zero-motion calibration on ESP32
   */
  async sendCalibrateCommand() {
    if (!this.isConnected || !this.commandChar) return false;
    const payload = JSON.stringify({ cmd: 'calibrate' });
    await this.commandChar.writeValue(new TextEncoder().encode(payload));
    return true;
  }
}

export const bleService = new BleService();
export default bleService;
