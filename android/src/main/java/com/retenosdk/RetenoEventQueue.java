package com.retenosdk;

import android.util.Log;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.ArrayList;
import java.util.List;

/**
 * Singleton event queue for Reteno SDK.
 * Queues events until JavaScript signals initialization is complete.
 */
public class RetenoEventQueue {
    private static final String TAG = "RetenoEventQueue";
    private static final int MAX_QUEUE_SIZE = 100;

    private static RetenoEventQueue instance;

    private final List<QueuedEvent> eventQueue = new ArrayList<>();
    private boolean isInitialized = false;
    private final Object lock = new Object();

    private static class QueuedEvent {
        final String eventName;
        final WritableMap eventData;

        QueuedEvent(String eventName, WritableMap eventData) {
            this.eventName = eventName;
            this.eventData = eventData;
        }
    }

    private RetenoEventQueue() {}

    public static synchronized RetenoEventQueue getInstance() {
        if (instance == null) {
            instance = new RetenoEventQueue();
        }
        return instance;
    }

    /**
     * Dispatch an event. If not initialized, queue it. If initialized, send immediately.
     */
    public void dispatch(String eventName, WritableMap eventData, @Nullable ReactContext reactContext) {
        synchronized (lock) {
            if (isInitialized && reactContext != null && reactContext.hasActiveReactInstance()) {
                sendEvent(eventName, eventData, reactContext);
            } else {
                queueEvent(eventName, eventData);
            }
        }
    }

    private void queueEvent(String eventName, WritableMap eventData) {
        if (eventQueue.size() >= MAX_QUEUE_SIZE) {
            Log.w(TAG, "Event queue full, dropping oldest event");
            eventQueue.remove(0);
        }
        eventQueue.add(new QueuedEvent(eventName, eventData));
        Log.d(TAG, "Queued event: " + eventName + ", queue size: " + eventQueue.size());
    }

    private void sendEvent(String eventName, WritableMap eventData, ReactContext reactContext) {
        try {
            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, eventData);
        } catch (Exception e) {
            Log.e(TAG, "Failed to send event: " + eventName, e);
        }
    }

    /**
     * Called from JavaScript to signal initialization is complete.
     * Flushes all queued events.
     */
    public void setInitialized(ReactContext reactContext) {
        synchronized (lock) {
            if (isInitialized) {
                Log.w(TAG, "Already initialized, ignoring duplicate call");
                return;
            }

            isInitialized = true;
            Log.d(TAG, "Initialized, flushing " + eventQueue.size() + " queued events");

            if (reactContext != null && reactContext.hasActiveReactInstance()) {
                for (QueuedEvent event : eventQueue) {
                    sendEvent(event.eventName, event.eventData, reactContext);
                }
            } else {
                Log.w(TAG, "ReactContext not available during flush, events will be lost");
            }
            eventQueue.clear();
        }
    }

    /**
     * Check if initialized (for debugging/testing)
     */
    public boolean isInitialized() {
        synchronized (lock) {
            return isInitialized;
        }
    }

    /**
     * Get pending event count (for debugging/testing)
     */
    public int getPendingEventCount() {
        synchronized (lock) {
            return eventQueue.size();
        }
    }
}
