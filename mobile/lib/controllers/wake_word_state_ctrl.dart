import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:livekit_client/livekit_client.dart' as sdk;

/// Server-side wake word detection state.
enum WakeWordState {
  /// Agent is waiting for wake word
  listening,

  /// Wake word detected, agent is processing conversation
  active,
}

/// Controller that listens for wakeword_state data packets from the backend.
///
/// This tracks server-side OpenWakeWord detection state, allowing the UI
/// to show whether the agent is waiting for wake word or actively listening.
class WakeWordStateCtrl extends ChangeNotifier {
  final sdk.Room room;
  late final sdk.EventsListener<sdk.RoomEvent> _listener;

  WakeWordState? _state;

  /// Current wake word state. Null if server-side detection is disabled.
  WakeWordState? get state => _state;

  /// Whether server-side wake word detection is active (we've received state updates).
  bool get isServerWakeWordActive => _state != null;

  WakeWordStateCtrl({required this.room}) {
    _listener = room.createListener();
    _listener.on<sdk.DataReceivedEvent>(_handleDataReceived);
  }

  void _handleDataReceived(sdk.DataReceivedEvent event) {
    // Only handle wakeword_state messages
    if (event.topic != 'wakeword_state') return;

    try {
      final jsonString = utf8.decode(event.data);
      final data = jsonDecode(jsonString) as Map<String, dynamic>;

      if (data['type'] == 'wakeword_state' && data['state'] != null) {
        final stateStr = data['state'] as String;
        _state = switch (stateStr) {
          'listening' => WakeWordState.listening,
          'active' => WakeWordState.active,
          _ => null,
        };
        notifyListeners();
      }
    } catch (error) {
      debugPrint('[WakeWordStateCtrl] Failed to parse wake word state: $error');
    }
  }

  /// Reset state (e.g., when disconnecting)
  void reset() {
    _state = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _listener.dispose();
    super.dispose();
  }
}
