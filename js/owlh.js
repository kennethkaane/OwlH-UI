function showConfig(oip, oname, oport, ouuid){
    var cfgform = document.getElementById('divconfigform');
    cfgform.style.display = "block";
    var name = document.getElementById('cfgnodename');
    var ip = document.getElementById('cfgnodeip');
    var port = document.getElementById('cfgnodeport');
    var uuid = document.getElementById('cfgnodeid');
    port.value = oport;
    name.value = oname;
    ip.value = oip;
    uuid.value = ouuid;
}

function PingNode(uuid) {
  var ipmaster = document.getElementById('ip-master').value;
  var portmaster = document.getElementById('port-master').value;
  var nodeurl = 'https://'+ ipmaster + ':' + portmaster + '/v1/node/ping/' + uuid;
  
  axios({
        method: 'get',
        url: nodeurl,
        timeout: 30000
    })
        .then(function (response) {
            if (response.data.ping=='pong') {
                document.getElementById(uuid+'-online').className = "badge bg-success align-text-bottom text-white";
                document.getElementById(uuid+'-online').innerHTML = "ON LINE";
                PingSuricata(uuid);
                PingZeek(uuid);
                PingWazuh(uuid);
                PingStap(uuid);
                return "true";
            } else {
                document.getElementById(uuid+'-online').className = "badge bg-danger align-text-bottom text-white";
                document.getElementById(uuid+'-online').innerHTML = "OFF LINE";
            }      
        })
            .catch(function (error) {
            return "false";
        });   
    return "false";
}

function GetAllNodes() {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var resultElement = document.getElementById('nodes-table');
    document.getElementById('addnids').style.display = "none";
    axios.get('https://' + ipmaster + ':' + portmaster + '/v1/node')
        .then(function (response) {
            document.getElementById('addnids').style.display = "block";
            resultElement.innerHTML = generateAllNodesHTMLOutput(response);
        })
        .catch(function (error) {
            resultElement.innerHTML = '<h3 align="center">No connection</h3>';
        });
}

function deleteNode(node) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://'+ipmaster+':'+portmaster+'/v1/node/'+node;
    axios({
        method: 'delete',
        url: nodeurl,
        timeout: 30000
    })
        .then(function (response) {
            GetAllNodes();
            return true;
        })
        .catch(function (error) {
            return false;
        });   
}

function formAddNids(){
    var addnids = document.getElementById('addnids');
    var nform = document.getElementById('nidsform');

    if (nform.style.display == "none") {
        nform.style.display = "block";
        addnids.innerHTML = "Close Add NIDS";
    } else {
        nform.style.display = "none";
        addnids.innerHTML = "Add NIDS";
    }
}

function generateAllNodesHTMLOutput(response) {
    var isEmpty = true;
    var nodes = response.data;
    var html =  '<table class="table table-hover">                            ' +
                '<thead>                                                      ' +
                '<tr>                                                         ' +
                '<th scope="col"></th>                                        ' +
                '<th scope="col">Name</th>                                    ' +
                '<th scope="col">Status</th>                                  ' +
                '<th scope="col">Tags <span style="font-size: 10px;"></span></th>            ' +
                '<th scope="col">Services</th>                                ' +
                '<th scope="col">Actions</th>                                 ' +
                '</tr>                                                        ' +
                '</thead>                                                     ' +
                '<tbody >'
    for (node in nodes) {
        isEmpty = false;
        if (nodes[node]['port'] != undefined) {
            port = nodes[node]['port'];
        } else {
            port = "10443";
        }
        var uuid = node;
        PingNode(uuid);
        getRulesetUID(uuid);

        html = html + '<tr>                                                                     '+
            '<th class="align-middle" scope="row"><img data-src="holder.js/16x16?theme=thumb&bg=007bff&fg=007bff&size=1" alt="" class="mr-2 rounded"></th>' +
            ' <td class="align-middle"> <strong>' + nodes[node]['name'] + '</strong>'           +
            ' <p class="text-muted">' + nodes[node]['ip'] + '</p>'                        +
            ' <i class="fas fa-code" title="Ruleset Management"></i> <span id="'+uuid+'-ruleset" class="text-muted small"></span>'                        +
            '</td>'                                                                             +
            '<td class="align-middle">                                                        ';
        html = html + '<span id="'+uuid+'-online" class="badge bg-dark align-text-bottom text-white">N/A</span></td>';
            html = html + ' <td class="align-middle" id="'+uuid+'-tag"></td><td class="align-middle">';
            html = html +'<p><img src="img/suricata.png" alt="" width="30"> '      +
            '  <span id="'+uuid+'-suricata" class="badge badge-pill bg-dark align-text-bottom text-white">N/A</span> |' + 
            '  <span style="font-size: 15px; color: grey;" >                                   ' +
            '    <i class="fas fa-stop-circle" id="'+uuid+'-suricata-icon" title="Stop Suricata" onclick="StopSuricata(\''+uuid+'\')"></i>                     ' +
            '    <i class="fas fa-sync-alt" title="Deploy ruleset" onclick="sendRulesetToNode('+"'"+uuid+"'"+')"></i>                                 ' +
            '    <a title="Configuration" style="cursor: default;" data-toggle="modal" data-target="#modal-change-bpf" onclick="loadBPF(\''+uuid+'\',\''+nodes[node]['name']+'\')">BPF</a>'+
            '    <i class="fas fa-code" title="Ruleset Management" data-toggle="modal" data-target="#modal-ruleset-management" onclick="loadRuleset(\''+uuid+'\')"></i>                        ' +
            '  </span>                                                                        ' +
            '  </p>                                                                           ' +
            '  <p><img  src="img/bro.png" alt="" width="30">'+
            '  <span id="'+uuid+'-zeek" class="badge badge-pill bg-dark align-text-bottom text-white">N/A</span> |                                       ' +
            '  <span style="font-size: 15px; color: grey;" >                                   ' +
            '    <i class="fas fa-stop-circle" id="'+uuid+'-zeek-icon"></i>                         ' +
            '    <i class="fab fa-wpforms" title="Zeek policy management"></i>                  ' +
            '  </span>                                                                        ' +
            '  </p>                                                                           ' +
            '  <p><img src="img/wazuh.png" alt="" width="30"> '+
            '  <span id="'+uuid+'-wazuh" class="badge badge-pill bg-dark align-text-bottom text-white">N/A</span> |                                        ' +
            '  <span style="font-size: 15px; color: grey;" >                                  ' +
            '    <i class="fas fa-stop-circle" id="'+uuid+'-wazuh-icon"></i>                         ' +
            '  </span></p> '+
            '  <p><i class="fas fa-plug fa-lg"></i>'+
            '  <span id="'+uuid+'-stap" class="badge badge-pill bg-dark align-text-bottom text-white">N/A</span> |                                         ' +
            '  <span style="font-size: 15px; color: grey;">                                   ' +
            '    <i class="fas fa-stop-circle" id="'+uuid+'-stap-icon"></i>                         ' +
            '    <a href="stap.html?uuid='+uuid+'&node='+nodes[node]['name']+'"><i class="fas fa-cog" title="Configuration" style="color: grey;"></i><a>                             ' +
            '  </span></p> ';                      
            html = html +   '</td>                                                              ' +
            '<td class="align-middle">                                                        ' +
            '  <span style="font-size: 20px; color: Dodgerblue;" >                            ' +
            '    <a href="files.html?uuid='+node+'&node='+nodes[node]['name']+'"><i class="fas fa-arrow-alt-circle-down" title="See node files"></i></a>             ' +
            '    <i class="fas fa-cogs" title="Modify node details" onclick="showConfig('+"'"+nodes[node]['ip']+"','"+nodes[node]['name']+"','"+nodes[node]['port']+"','"+uuid+"'"+');"></i>                            ' +
            '    <a href="edit.html?uuid='+node+'&file=main.conf&node='+nodes[node]['name']+'" style="font-size: 20px; color: Dodgerblue;"><i class="fas fa-cog" title="Edit node configuration"></i></a>           ' +
            '    <a style="font-size: 20px; color: Dodgerblue;" onclick="deleteNodeModal('+"'"+node+"'"+', '+"'"+nodes[node]['name']+"'"+');"> ' +
            '      <i class="fas fa-trash-alt" title="Delete Node" data-toggle="modal" data-target="#modal-delete-nodes"></i>                         ' +
            '    </a>                                                                            ' +
            '  </span>                                                                           ' +
            '</td>                                                                               ' +
            '</tr>';

    }
    html = html + '</tbody></table>';
    if (isEmpty){
        return '<div style="text-align:center"><h3>No nodes created. You can create a node now!</h3></div>';
    }else{
        return  html;
    }
}

function sendRulesetToNode(uuid){
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://'+ ipmaster + ':' + portmaster + '/v1/node/ruleset/set/' + uuid;
    axios({
        method: 'get',
        url: nodeurl,
        timeout: 30000
    })
    .then(function (response) {
        return true;
    })
    .catch(function (error) {
        return false;
    });
}

//Run suricata system
function RunSuricata(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/node/RunSuricata/' + uuid;
    axios({
        method: 'put',
        url: nodeurl,
        //httpsAgent: agent,
        timeout: 30000
    })
        .then(function (response) {

            console.log("DATA RETRIEVED FROM RUNsURICATA"+response);
            // GetAllNodes();
        })
        .catch(function error() {
        });

    GetAllNodes();
}

//Stop suricata system
function StopSuricata(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/node/StopSuricata/' + uuid;
    axios({
        method: 'put',
        url: nodeurl,
        timeout: 30000,
    })
        .then(function (response) {
            // GetAllNodes();
        })
        .catch(function error() {
        });

    GetAllNodes();
}

function PingSuricata(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/node/suricata/' + uuid;
    axios({
        method: 'get',
        url: nodeurl,
        timeout: 30000
    })
        .then(function (response) {
            if (!response.data.path && !response.data.bin) {
                document.getElementById(uuid + '-suricata').className = "badge bg-dark align-text-bottom text-white";
                document.getElementById(uuid + '-suricata').innerHTML = "N/A";
                document.getElementById(uuid + '-suricata-icon').className = "fas fa-play-circle";
                document.getElementById(uuid + '-suricata-icon').onclick = function () { RunSuricata(uuid); };
                document.getElementById(uuid + '-suricata-icon').title = "Run Suricata";
            } else if (response.data.path || response.data.bin) {
                if (response.data.running) {
                    document.getElementById(uuid + '-suricata').className = "badge bg-success align-text-bottom text-white";
                    document.getElementById(uuid + '-suricata').innerHTML = "ON";
                    document.getElementById(uuid + '-suricata-icon').className = "fas fa-stop-circle";
                    document.getElementById(uuid + '-suricata-icon').onclick = function () { StopSuricata(uuid); };
                    document.getElementById(uuid + '-suricata-icon').title = "Stop Suricata";
                } else {
                    document.getElementById(uuid + '-suricata').className = "badge bg-danger align-text-bottom text-white";
                    document.getElementById(uuid + '-suricata').innerHTML = "OFF";
                    document.getElementById(uuid + '-suricata-icon').className = "fas fa-play-circle";
                    document.getElementById(uuid + '-suricata-icon').onclick = function () { RunSuricata(uuid); };
                    document.getElementById(uuid + '-suricata-icon').title = "Run Suricata";
                }
            }
            return true;
        })
        .catch(function (error) {
            document.getElementById(uuid + '-suricata').className = "badge bg-dark align-text-bottom text-white";
            document.getElementById(uuid + '-suricata').innerHTML = "N/A";
            return false;
        });
    return false;
}


//Run Zeek system
function RunZeek(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/node/RunZeek/' + uuid;
    axios({
        method: 'put',
        url: nodeurl,
        timeout: 30000
    })
        .then(function (response) {
        })
        .catch(function error() {
        });

    GetAllNodes();
}

//Stop Zeek system
function StopZeek(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/node/StopZeek/' + uuid;
    axios({
        method: 'put',
        url: nodeurl,
        timeout: 30000,
    })
        .then(function (response) {
        })
        .catch(function error() {
        });

    GetAllNodes();
}

function PingZeek(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/node/zeek/' + uuid;
    axios({
        method: 'get',
        url: nodeurl,
        timeout: 30000
    })
        .then(function (response) {
            if (!response.data.path && !response.data.bin) {
                console.log("!path && !bin");
                document.getElementById(uuid + '-zeek').className = "badge bg-dark align-text-bottom text-white";
                document.getElementById(uuid + '-zeek').innerHTML = "N/A";
                document.getElementById(uuid + '-zeek-icon').className = "fas fa-play-circle";
                document.getElementById(uuid + '-zeek-icon').onclick = function () { RunZeek(uuid); };
                document.getElementById(uuid + '-zeek-icon').title = "Run zeek";
            } else if (response.data.path || response.data.bin) {
                if (response.data.running) {
                    document.getElementById(uuid + '-zeek').className = "badge bg-success align-text-bottom text-white";
                    document.getElementById(uuid + '-zeek').innerHTML = "ON";
                    document.getElementById(uuid + '-zeek-icon').className = "fas fa-stop-circle";
                    document.getElementById(uuid + '-zeek-icon').onclick = function () { StopZeek(uuid); };
                    document.getElementById(uuid + '-zeek-icon').title = "Stop Zeek";
                } else {
                    document.getElementById(uuid + '-zeek').className = "badge bg-danger align-text-bottom text-white";
                    document.getElementById(uuid + '-zeek').innerHTML = "OFF";
                    document.getElementById(uuid + '-zeek-icon').className = "fas fa-play-circle";
                    document.getElementById(uuid + '-zeek-icon').onclick = function () { RunZeek(uuid); };
                    document.getElementById(uuid + '-zeek-icon').title = "Run Zeek";
                }
            }
            return true;
        })
        .catch(function (error) {
            document.getElementById(uuid + '-zeek').className = "badge bg-dark align-text-bottom text-white";
            document.getElementById(uuid + '-zeek').innerHTML = "N/A";

            return false;
        });
    return false;
}

//Run Zeek system
function RunWazuh(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/node/RunWazuh/' + uuid;
    axios({
        method: 'put',
        url: nodeurl,
        timeout: 30000
    })
        .then(function (response) {
        })
        .catch(function error() {
            console.log(error);
        });

    GetAllNodes();
}

//Stop Wazuh system
function StopWazuh(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/node/StopWazuh/' + uuid;
    axios({
        method: 'put',
        url: nodeurl,
        timeout: 30000,
    })
        .then(function (response) {
        })
        .catch(function error() {
            console.log(error);
        });

    GetAllNodes();
}

function PingWazuh(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/node/wazuh/' + uuid;
    axios({
        method: 'get',
        url: nodeurl,
        timeout: 30000
    })
        .then(function (response) {
            if (!response.data.path && !response.data.bin) {
                document.getElementById(uuid + '-wazuh').className = "badge bg-dark align-text-bottom text-white";
                document.getElementById(uuid + '-wazuh').innerHTML = "N/A";
                document.getElementById(uuid + '-wazuh-icon').className = "fas fa-play-circle";
                document.getElementById(uuid + '-wazuh-icon').onclick = function () { RunWazuh(uuid); };
                document.getElementById(uuid + '-wazuh-icon').title = "Run Wazuh";
            } else if (response.data.path || response.data.bin) {
                if (response.data.running) {
                    document.getElementById(uuid + '-wazuh').className = "badge bg-success align-text-bottom text-white";
                    document.getElementById(uuid + '-wazuh').innerHTML = "ON";
                    document.getElementById(uuid + '-wazuh-icon').className = "fas fa-stop-circle";
                    document.getElementById(uuid + '-wazuh-icon').onclick = function () { StopWazuh(uuid); };
                    document.getElementById(uuid + '-wazuh-icon').title = "Stop Wazuh";
                } else {
                    document.getElementById(uuid + '-wazuh').className = "badge bg-danger align-text-bottom text-white";
                    document.getElementById(uuid + '-wazuh').innerHTML = "OFF";
                    document.getElementById(uuid + '-wazuh-icon').className = "fas fa-play-circle";
                    document.getElementById(uuid + '-wazuh-icon').onclick = function () { RunWazuh(uuid); };
                    document.getElementById(uuid + '-wazuh-icon').title = "Run Wazuh";
                }
            }
            return true;
        })
        .catch(function (error) {
            document.getElementById(uuid + '-wazuh').className = "badge bg-dark align-text-bottom text-white";
            document.getElementById(uuid + '-wazuh').innerHTML = "N/A";
            return false;
        });
    return false;
}

//Run stap system
function RunStap(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/stap/RunStap/' + uuid;
    axios({
        method: 'put',
        url: nodeurl,
        timeout: 30000
    })
        .then(function (response) {
        })
        .catch(function error() {
        });
    GetAllNodes();
}

//Stop stap system
function StopStap(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/stap/StopStap/' + uuid;
    axios({
        method: 'put',
        url: nodeurl,
        timeout: 30000,
    })
        .then(function (response) {
        })
        .catch(function error() {
        });
    GetAllNodes();
}

function PingStap(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/stap/stap/' + uuid;
    axios({
        method: 'get',
        url: nodeurl,
        timeout: 30000
    })
        .then(function (response) {
            if (!response.data.stapStatus) {
                document.getElementById(uuid + '-stap').className = "badge bg-danger align-text-bottom text-white";
                document.getElementById(uuid + '-stap').innerHTML = "OFF";
                document.getElementById(uuid + '-stap-icon').className = "fas fa-play-circle";
                document.getElementById(uuid + '-stap-icon').onclick = function () { RunStap(uuid); };
                document.getElementById(uuid + '-stap-icon').title = "Run stap";
            } else {
                document.getElementById(uuid + '-stap').className = "badge bg-success align-text-bottom text-white";
                document.getElementById(uuid + '-stap').innerHTML = "ON";
                document.getElementById(uuid + '-stap-icon').className = "fas fa-stop-circle";
                document.getElementById(uuid + '-stap-icon').onclick = function () { StopStap(uuid); };
                document.getElementById(uuid + '-stap-icon').title = "Stop stap";
            }
        })
        .catch(function (error) {
            document.getElementById(uuid + '-stap').className = "badge bg-dark align-text-bottom text-white";
            document.getElementById(uuid + '-stap').innerHTML = "N/A";
            return false;
        });
    return false;
}




function getRulesetUID(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/ruleset/get/' + uuid;
    axios({
        method: 'get',
        url: nodeurl,
        timeout: 30000
    })
        .then(function (response) {
            getRuleName(response.data, uuid);
            return true;
        })
        .catch(function (error) {
            return false;
        });
}

function getRuleName(uuidRuleset, uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/ruleset/get/name/' + uuidRuleset;
    axios({
        method: 'get',
        url: nodeurl,
        timeout: 30000
    })
        .then(function (response) {
            if (typeof response.data.error != "undefined") {
                document.getElementById(uuid + '-ruleset').innerHTML = "No ruleset selected...";
                document.getElementById(uuid + '-ruleset').className = "text-danger";
            } else {
                document.getElementById(uuid + '-ruleset').innerHTML = response.data;
                document.getElementById(uuid + '-ruleset').className = "text-muted-small";
            }
            return response.data;
        })
        .catch(function (error) {
            return false;
        });
}

//load json data from local file
function loadJSONdata() {
    $.getJSON('../conf/ui.conf', function (data) {
        var ipLoad = document.getElementById('ip-master');
        ipLoad.value = data.master.ip;
        var portLoad = document.getElementById('port-master');
        portLoad.value = data.master.port;
        loadTitleJSONdata();
        GetAllNodes();
    });
}
loadJSONdata();