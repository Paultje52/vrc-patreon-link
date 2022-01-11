using AvatarImageReader;
using TMPro;
using UdonSharp;
using UnityEngine;
using VRC.SDKBase;
using VRC.Udon;

[UdonBehaviourSyncMode(BehaviourSyncMode.None)]
public class PatreonDecoder : UdonSharpBehaviour
{
    [SerializeField] private ReadRenderTexture readRenderTexture;

    [SerializeField] private TextMeshPro[] outputTMPs;
    [SerializeField] private TextMeshPro[] outputHeaders;
    [SerializeField] private string[] roleNames;
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
        string[] splitText = readRenderTexture.outputString.Split('\n');
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
                _DecodeList(roleStrings[currentStep], outputTMPs[currentStep], outputHeaders[currentStep]);
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

    private void _DecodeList(string input, TextMeshPro target, TextMeshPro header)
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

        header.text = users[0];
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