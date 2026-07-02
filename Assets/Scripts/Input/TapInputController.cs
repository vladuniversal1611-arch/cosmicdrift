using System;
using UnityEngine;

namespace Scanline.Input
{
    public class TapInputController : MonoBehaviour
    {
        public event Action OnTap;

        private void Update()
        {
            if (UnityEngine.Input.GetMouseButtonDown(0))
            {
                OnTap?.Invoke();
                return;
            }

            if (UnityEngine.Input.touchCount > 0 &&
                UnityEngine.Input.GetTouch(0).phase == TouchPhase.Began)
            {
                OnTap?.Invoke();
            }
        }
    }
}
