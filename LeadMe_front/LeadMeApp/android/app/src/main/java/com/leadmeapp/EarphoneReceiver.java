package com.leadmeapp;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioManager;
import android.util.Log;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class EarphoneReceiver extends BroadcastReceiver {
    private static DeviceEventManagerModule.RCTDeviceEventEmitter emitter;

    public static void setEmitter(DeviceEventManagerModule.RCTDeviceEventEmitter emitter) {
        EarphoneReceiver.emitter = emitter;
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent.getAction().equals(Intent.ACTION_HEADSET_PLUG)) {
            int state = intent.getIntExtra("state", -1);

            if (emitter != null) {
                emitter.emit("EarphoneStateChanged", state == 1); // true: 연결됨
            }
        }
    }
}
