package com.leadmeapp;

import android.bluetooth.BluetoothA2dp;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothProfile;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.media.AudioManager;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class EarphoneModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public EarphoneModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @NonNull
    @Override
    public String getName() {
        return "EarphoneModule";
    }

    private final BroadcastReceiver headsetReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            boolean isWiredHeadsetOn = intent.getIntExtra("state", 0) == 1;
            sendEvent("onHeadphoneStateChange", isWiredHeadsetOn);
        }
    };

    private final BroadcastReceiver bluetoothReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            final String action = intent.getAction();
            if (BluetoothA2dp.ACTION_CONNECTION_STATE_CHANGED.equals(action)) {
                int state = intent.getIntExtra(BluetoothProfile.EXTRA_STATE, -1);
                boolean connected = state == BluetoothProfile.STATE_CONNECTED;
                sendEvent("onBluetoothHeadsetStateChange", connected);
            }
        }
    };

    private void sendEvent(String eventName, boolean state) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, state);
    }

    @ReactMethod
    public void registerReceiver() {
        IntentFilter wiredFilter = new IntentFilter(Intent.ACTION_HEADSET_PLUG);
        reactContext.registerReceiver(headsetReceiver, wiredFilter);

        IntentFilter bluetoothFilter = new IntentFilter(BluetoothA2dp.ACTION_CONNECTION_STATE_CHANGED);
        reactContext.registerReceiver(bluetoothReceiver, bluetoothFilter);
    }

    @ReactMethod
    public void unregisterReceiver() {
        try {
            reactContext.unregisterReceiver(headsetReceiver);
            reactContext.unregisterReceiver(bluetoothReceiver);
        } catch (IllegalArgumentException ignored) {}
    }

    @ReactMethod
    public void isAnyHeadphoneConnected(com.facebook.react.bridge.Promise promise) {
        AudioManager audioManager = (AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);
        boolean wired = audioManager.isWiredHeadsetOn();
        boolean bluetooth = audioManager.isBluetoothA2dpOn();
        promise.resolve(wired || bluetooth);
    }
}
