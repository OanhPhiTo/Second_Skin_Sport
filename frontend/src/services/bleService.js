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
  }

  isSupported() {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
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

      this.device.addEventListener('gattserverdisconnected', this.handleDisconnect.bind(this));

      this.notifyStatus('connecting', { message: `Đang kết nối GATT Server với ${this.device.name}...` });

      // Connect to GATT Server
      this.server = await this.device.gatt.connect();

      this.notifyStatus('connecting', { message: 'Đang tìm kiếm Service SecondSkin Sport...' });
      this.service = await this.server.getPrimaryService(BLE_CONFIG.SERVICE_UUID);

      // Get Sensor Telemetry Characteristic
      this.sensorChar = await this.service.getCharacteristic(BLE_CONFIG.SENSOR_CHAR_UUID);
      await this.sensorChar.startNotifications();
      this.sensorChar.addEventListener(
        'characteristicvaluechanged',
        this.handleSensorData.bind(this)
      );

      // Get Command Characteristic (for WiFi Provisioning & Control)
      try {
        this.commandChar = await this.service.getCharacteristic(BLE_CONFIG.COMMAND_CHAR_UUID);
        // Start notifications on command char for WiFi responses
        await this.commandChar.startNotifications();
        this.commandChar.addEventListener(
          'characteristicvaluechanged',
          this.handleCommandResponse.bind(this)
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
    if (this.device && this.device.gatt.connected) {
      await this.device.gatt.disconnect();
    }
    this.handleDisconnect();
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
}

export const bleService = new BleService();
export default bleService;
