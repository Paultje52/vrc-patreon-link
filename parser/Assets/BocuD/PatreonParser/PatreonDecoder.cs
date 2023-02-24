using AvatarImageReader;
using TMPro;
using UdonSharp;
using UnityEngine;
using VRC.SDKBase;
using VRC.Udon;

#if UNITY_EDITOR && !COMPILER_UDONSHARP
using UdonSharpEditor;
using UnityEditor;

[CustomEditor(typeof(PatreonDecoder))]
public class PatreonDecoderEditor : Editor
{
    private bool showDefaultInspector;
    
    public override void OnInspectorGUI()
    {
        if (UdonSharpGUI.DrawDefaultUdonSharpBehaviourHeader(target)) return;

        PatreonDecoder decoder = (PatreonDecoder)target;
        decoder.UpdateProxy();
        EditorGUI.BeginChangeCheck();
        
        GUIStyle bigHeaderStyle = new GUIStyle(EditorStyles.label) {richText = true, fontSize = 15};
        GUIStyle headerStyle = new GUIStyle(EditorStyles.label) {richText = true};
            
        EditorGUILayout.LabelField("<b>VRC Patreon Link Parser</b>", bigHeaderStyle);

        decoder.avatarImageReader = (AvatarImagePrefab)EditorGUILayout.ObjectField("Linked to: ",
            decoder.avatarImageReader, typeof(AvatarImagePrefab), true);
        
        if(decoder.avatarImageReader == null) EditorGUILayout.HelpBox("Make sure to link PatreonDecoder to a valid AvatarImageReader instance.", MessageType.Warning);

        EditorGUILayout.Space(4);

        EditorGUILayout.BeginHorizontal();
        EditorGUILayout.LabelField("<b>Role settings</b>", headerStyle);

        if (decoder.roleNames == null)
        {
            decoder.roleNames = new string[0];
            decoder.outputTMPs = new TextMeshPro[0];
        }

        if (GUILayout.Button("Add Role"))
        {
            ArrayUtility.Add(ref decoder.roleNames, "New role");
            ArrayUtility.Add(ref decoder.outputTMPs, null);
        }
        EditorGUILayout.EndHorizontal();

        for (int i = 0; i < decoder.roleNames.Length; i++)
        {
            EditorGUILayout.BeginVertical("helpbox");
            EditorGUILayout.BeginHorizontal();
            
            EditorGUILayout.LabelField(decoder.roleNames[i]);

            if (GUILayout.Button("Remove"))
            {
                ArrayUtility.RemoveAt(ref decoder.roleNames, i);
                ArrayUtility.RemoveAt(ref decoder.outputTMPs, i);
                EditorGUILayout.EndHorizontal();
                continue;
            }
            EditorGUILayout.EndHorizontal();
            
            decoder.roleNames[i] = EditorGUILayout.TextField("Role name", decoder.roleNames[i]);
            decoder.outputTMPs[i] = (TextMeshPro)EditorGUILayout.ObjectField("TMP output (optional)",
                decoder.outputTMPs[i], typeof(TextMeshPro), true);
            EditorGUILayout.EndVertical();
        }
        
        EditorGUILayout.HelpBox("Any role you wish to check for in code needs to be added here first.", MessageType.Info);
        
        if (EditorGUI.EndChangeCheck())
        {
            decoder.ApplyProxyModifications();

            EditorUtility.SetDirty(UdonSharpEditorUtility.GetBackingUdonBehaviour(decoder));

            if (PrefabUtility.IsPartOfAnyPrefab(decoder.gameObject))
            {
                PrefabUtility.RecordPrefabInstancePropertyModifications(
                    UdonSharpEditorUtility.GetBackingUdonBehaviour(decoder));
            }
        }

        showDefaultInspector = EditorGUILayout.Foldout(showDefaultInspector, "Show default inspector");
        if (showDefaultInspector)
        {
            DrawDefaultInspector();
        }
    }
}

#endif

[UdonBehaviourSyncMode(BehaviourSyncMode.None)]
public class PatreonDecoder : UdonSharpBehaviour
{
    public RuntimeDecoder avatarImageReader;

    public string[] roleNames;
    public TextMeshPro[] outputTMPs;
    
    private string[] roleStrings;
    public bool decodeFinished;

    [Header("On Decode")] 
    public bool sendCustomEvent;
    public UdonBehaviour targetBehaviour;
    public string eventName;
    
    public void _StartDecode()
    {
        Debug.Log("[<color=blue>VRCPatreonLink</color>] Starting decode...");
        
        //different roles are split by newline
        string[] splitText = avatarImageReader.outputString.Split('\n');
        roleStrings = new string[roleNames.Length];

        for (int index = 0; index < roleStrings.Length; index++)
        {
            roleStrings[index] = "";
        }

        //match each line to its role equivalent
        foreach (string s in splitText)
        {
            //loop through all possible roles to try to find a match
            for (int role = 0; role < roleNames.Length; role++)
            {
                //skip if the line doesn't start with the predetermined role name
                if (!s.StartsWith(roleNames[role])) continue;
                
                roleStrings[role] = s;
            }
        }

        //Start decoding the strings (loops through patrons, hence why its split over multiple batches based on each role)
        _DecodeStep();
    }

    private int currentStep = 0;
    public void _DecodeStep()
    {
        Debug.Log($"[<color=blue>VRCPatreonLink</color>] Decoding list... Step {currentStep}");
        if (currentStep < roleNames.Length)
        {
            //only proceed if this role was matched
            if (roleStrings[currentStep].Length > 0)
            {
                _DecodeList(roleStrings[currentStep], outputTMPs[currentStep]);
            }
            currentStep++;
            SendCustomEventDelayedFrames(nameof(_DecodeStep), 5);
        }
        else
        {
            Debug.Log($"[<color=blue>VRCPatreonLink</color>] Finished! Running callback...");
            if (sendCustomEvent)
            {
                if (targetBehaviour != null && eventName.Length > 0)
                {
                    targetBehaviour.SendCustomEvent(eventName);
                }
            }

            decodeFinished = true;
        }
    }

    private void _DecodeList(string input, TextMeshPro target)
    {
        string[] users = input.Split('.');
        string output = "";

        string playerName = Networking.LocalPlayer.displayName;

        for (int index = 1; index < users.Length; index++)
        {
            output += users[index];
            output += '\n';

            if (users[index] == playerName)
            {
                Debug.Log($"[<color=blue>VRCPatreonLink</color>] Local player has rank {users[0]}");
                localPlayerRoles += users[0] + ".";
            }
        }
        
        if (target != null)
            target.text = output;
    }

    private string localPlayerRoles = "";

    /// <summary>
    /// Check if the local player has the specified role
    /// Should only be called once decoding has finished
    /// </summary>
    /// <param name="rank">Role to search for</param>
    /// <returns>true if the player has the specified role</returns>
    public bool LocalPlayerHasRole(string rank)
    {
        return localPlayerRoles.Contains(rank + ".");
    }

    /// <summary>
    /// Returns an array of player display names for the specified role
    /// </summary>
    /// <param name="targetRole">The discord role name</param>
    /// <returns>String array</returns>
    public string[] _GetPatronsByString(string targetRole)
    {
        //try to match the input string to a role
        int roleID = -1;
        
        //loop through all possible roles to try to find a match
        for (int role = 0; role < roleNames.Length; role++)
        {
            if (targetRole == roleNames[role]) roleID = role;
        }

        if (roleID != -1)
        {
            return _GetPatronsFromID(roleID);
        }
        else
        {
            return new string[0];
        }
    }
    
    public string[] _GetPatronsFromID(int roleID)
    {
        if (roleID < roleStrings.Length)
        {
            //get rid of the period after the role name
            string splitString = roleStrings[roleID].Substring(roleNames[roleID].Length);
            return splitString.Split('.');
        }
        else return new string[0];
    }
}