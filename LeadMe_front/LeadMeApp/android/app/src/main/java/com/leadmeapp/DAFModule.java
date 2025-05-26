package com.leadmeapp;

import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioRecord;
import android.media.AudioTrack;
import android.media.MediaRecorder;
import android.os.Handler;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class DAFModule extends ReactContextBaseJavaModule {
    private AudioRecord audioRecord;
    private AudioTrack audioTrack;
    private Thread dafThread;
    private boolean isRunning = false;

    private final int SAMPLE_RATE = 16000;
    private final int DELAY_MS = 200; // 200ms 딜레이

    public DAFModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "DAFModule";
    }

    @ReactMethod
    public void startDAF() {
        if (isRunning) return;

        int bufferSize = AudioRecord.getMinBufferSize(SAMPLE_RATE,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT);

        //AudioRecord 초기화(녹음용)
        audioRecord = new AudioRecord(MediaRecorder.AudioSource.MIC,
                SAMPLE_RATE,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                bufferSize);

        //AudioTrack 초기화 (재생용용)
        audioTrack = new AudioTrack(AudioManager.STREAM_MUSIC,
                SAMPLE_RATE,
                AudioFormat.CHANNEL_OUT_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                bufferSize,
                AudioTrack.MODE_STREAM);

        //녹음, 재생 시작작
        isRunning = true;
        audioRecord.startRecording();
        audioTrack.play();

        //백그라운드 스레드 시작
        dafThread = new Thread(() -> {
            //지연 버퍼 생성
            byte[] buffer = new byte[bufferSize];
            int delaySamples = (SAMPLE_RATE * DELAY_MS) / 1000;
            byte[] delayBuffer = new byte[delaySamples * 2]; // 16-bit

            int delayIndex = 0;
            //오디오 읽기 + 딜레이 적용 + 재생
            while (isRunning) {
                int read = audioRecord.read(buffer, 0, buffer.length);
                if (read > 0) {
                    // Circular delay buffer
                    for (int i = 0; i < read; i++) {
                        byte temp = delayBuffer[delayIndex];
                        delayBuffer[delayIndex] = buffer[i];
                        buffer[i] = temp;

                        delayIndex = (delayIndex + 1) % delayBuffer.length;
                    }
                    audioTrack.write(buffer, 0, read);
                }
            }
        });
        dafThread.start();
    }

    @ReactMethod
    public void stopDAF() {
        isRunning = false;
        if (audioRecord != null) {
            audioRecord.stop();
            audioRecord.release();
            audioRecord = null;
        }
        if (audioTrack != null) {
            audioTrack.stop();
            audioTrack.release();
            audioTrack = null;
        }
        if (dafThread != null) {
            dafThread.interrupt();
            dafThread = null;
        }
    }
}
