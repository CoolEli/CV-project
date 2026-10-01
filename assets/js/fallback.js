/* Static fallback: if the React folder failed to mount (CDN blocked etc.), show plain info pills. */
(function(){
  function isZh(){ return document.documentElement.lang === 'zh-CN'; }
  function fallback(){
    if (window.__folderMounted) return;
    var mount = document.getElementById('folderMount');
    if (!mount || mount.children.length) return;
    var zh = isZh();
    var items = zh ? ['\u51fa\u751f \u00b7 1998.08', '\u5e74\u9f84 \u00b7 28', '\u6027\u522b \u00b7 \u7537', '\u5c45\u4f4f\u5730 \u00b7 \u4e2d\u56fd\u6df1\u5733', '\u5b66\u5386 \u00b7 MFA\u7855\u58eb']
                   : ['Born \u00b7 1998.08', 'Age \u00b7 28', 'Gender \u00b7 Male', 'Shenzhen, China', 'Degree \u00b7 MFA'];
    var s = '<div class="folder-fallback"><div class="folder-fallback__label">' + (zh ? '\u5173\u4e8e\u6211' : 'About Me') + '</div>';
    for (var i = 0; i < items.length; i++) s += '<div class="folder-fallback__pill">' + items[i] + '</div>';
    mount.innerHTML = s + '</div>';
  }
  window.addEventListener('load', function(){ setTimeout(fallback, 8000); });
})();
