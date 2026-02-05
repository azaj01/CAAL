import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../l10n/app_localizations.dart';
import '../services/config_service.dart';

/// Setup screen for initial server URL configuration.
/// Full agent settings are available via the gear icon in the control bar
/// during an active session.
class SetupScreen extends StatefulWidget {
  final ConfigService configService;
  final VoidCallback onConfigured;

  const SetupScreen({
    super.key,
    required this.configService,
    required this.onConfigured,
  });

  @override
  State<SetupScreen> createState() => _SetupScreenState();
}

enum _StatusKey {
  serverUrlInvalid,
  completeWizardFirst,
  couldNotReach,
  couldNotConnect,
}

class _SetupScreenState extends State<SetupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _serverUrlController = TextEditingController();
  bool _isSaving = false;
  _StatusKey? _statusKey;

  @override
  void initState() {
    super.initState();
    _serverUrlController.text = widget.configService.serverUrl;
  }

  @override
  void dispose() {
    _serverUrlController.dispose();
    super.dispose();
  }

  String get _webhookUrl {
    final serverUrl = _serverUrlController.text.trim();
    if (serverUrl.isEmpty) return '';
    final uri = Uri.tryParse(serverUrl);
    if (uri == null) return '';
    return 'http://${uri.host}:8889';
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSaving = true;
      _statusKey = null;
    });

    try {
      // Check if wizard has been completed on the server
      final webhookUrl = _webhookUrl;
      if (webhookUrl.isEmpty) {
        setState(() => _statusKey = _StatusKey.serverUrlInvalid);
        return;
      }

      try {
        final res = await http
            .get(Uri.parse('$webhookUrl/setup/status'))
            .timeout(const Duration(seconds: 5));

        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          if (data['completed'] != true) {
            setState(() => _statusKey = _StatusKey.completeWizardFirst);
            return;
          }
        } else {
          setState(() => _statusKey = _StatusKey.couldNotReach);
          return;
        }
      } catch (e) {
        setState(() => _statusKey = _StatusKey.couldNotConnect);
        return;
      }

      // All checks passed - save and proceed
      await widget.configService.setServerUrl(_serverUrlController.text.trim());
      widget.onConfigured();
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  String? _getStatusMessage(AppLocalizations l10n) {
    return switch (_statusKey) {
      _StatusKey.serverUrlInvalid => l10n.serverUrlInvalid,
      _StatusKey.completeWizardFirst => l10n.completeWizardFirst,
      _StatusKey.couldNotReach => l10n.couldNotReach,
      _StatusKey.couldNotConnect => l10n.couldNotConnect,
      null => null,
    };
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final isFirstSetup = !widget.configService.isConfigured;

    return Scaffold(
      backgroundColor: const Color(0xFF1A1A1A),
      appBar: isFirstSetup
          ? null
          : AppBar(
              backgroundColor: const Color(0xFF1A1A1A),
              leading: IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () => Navigator.of(context).pop(),
              ),
              title: Text(l10n.connection, style: const TextStyle(color: Colors.white)),
            ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 36),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (isFirstSetup) ...[
                    const Icon(Icons.graphic_eq, size: 80, color: Colors.white),
                    const SizedBox(height: 16),
                    Text(
                      l10n.caalSetup,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      l10n.enterServerToStart,
                      style: const TextStyle(fontSize: 16, color: Colors.white70),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 40),
                  ],

                  // Server URL field
                  Text(
                    l10n.serverUrl,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _serverUrlController,
                    keyboardType: TextInputType.url,
                    autocorrect: false,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: l10n.serverUrlHint,
                      hintStyle: const TextStyle(color: Colors.white38),
                      filled: true,
                      fillColor: const Color(0xFF2A2A2A),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return l10n.serverUrlRequired;
                      }
                      final uri = Uri.tryParse(value.trim());
                      if (uri == null || !uri.hasScheme || !uri.hasAuthority) {
                        return l10n.serverUrlInvalid;
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 6),
                  Text(
                    l10n.yourServerAddress,
                    style: const TextStyle(fontSize: 12, color: Colors.white54),
                  ),
                  const SizedBox(height: 24),

                  // Status message (wizard not complete, connection error, etc.)
                  if (_getStatusMessage(l10n) != null) ...[
                    Text(
                      _getStatusMessage(l10n)!,
                      style: const TextStyle(fontSize: 13, color: Colors.orange),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Save button
                  SizedBox(
                    height: 50,
                    child: TextButton(
                      onPressed: _isSaving ? null : _save,
                      style: TextButton.styleFrom(
                        backgroundColor: const Color(0xFF45997C),
                        foregroundColor: const Color(0xFF171717),
                        disabledForegroundColor: const Color(0xFF171717),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                      ),
                      child: _isSaving
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation(Color(0xFF171717)),
                              ),
                            )
                          : Text(
                              isFirstSetup ? l10n.connect : l10n.save,
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                    ),
                  ),

                  if (isFirstSetup) ...[
                    const SizedBox(height: 24),
                    Text(
                      l10n.completeWizardHint,
                      style: const TextStyle(fontSize: 12, color: Colors.white38),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
