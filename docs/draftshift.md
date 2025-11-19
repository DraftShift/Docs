# DraftShift Design 

{% for class, class_data in members.items() %}
## {{ class }}
<div class="grid cards" style="text-align: center;" markdown>

{% for member, data in class_data.items() %}
- ### {{ member }}
    ![{{ member }}]({{ data.github ~ ".png?size=128" }}){: style="max-width: 128px; display: block; margin: 0 auto; border: 1px solid #999; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);"}
    
    **Role:** {{ data.role }}

    **Discord:** {{ data.discord }}

    [:fontawesome-brands-github: GitHub]({{ data.github }}){:target="_blank" .md-button}

{% endfor %}
</div>
{% endfor %}

## Special Mentions
* Testing the LDO parts (Discord names): arthurledaron, broncosis, dudewithan02, dweenz, fr0stbyt3, gmbridge, hartk, rferrington783, theaninova
* [Usermod Contributors](https://github.com/DraftShift/StealthChanger/tree/main/UserMods){target="_blank"}.
