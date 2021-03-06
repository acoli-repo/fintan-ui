window.onload = function() {

	$(document).ready(function() {
		function PipelineError(message) {
			this.name = 'PipelineError';
			this.message = message;
			this.stack = (new Error()).stack;
		}
		PipelineError.prototype = Error.prototype;


        // Initialize tooltips to show description of service in the services area
        $(function () {
            $('[data-toggle="tooltip"]').tooltip();
        });

        // Closing the options panel when the user clicks the little x
        $('.close').on('click', function () {
            $('#options').hide("slide", {direction: "right"}, 400);
            return false;
        });

        // Add minus icon for collapse element which is open by default
        $(".collapse.show").each(function(){
        	$(this).prev(".card-header").find(".fa").addClass("fa-minus").removeClass("fa-plus");
        });

        // Toggle plus minus icon on show hide of collapse element
        $(".collapse").on('show.bs.collapse', function(){
        	$(this).prev(".card-header").find(".fa").removeClass("fa-plus").addClass("fa-minus");
        }).on('hide.bs.collapse', function(){
        	$(this).prev(".card-header").find(".fa").removeClass("fa-minus").addClass("fa-plus");
        });

        // listing the available colours in bootstrap library to colour the services bubbles
        const colours = ["success", "info", "warning", "danger"];

        // load json file to a variable
		function load_json_file(file){
			// file = file.replace(/transformations|services\//, '');
			var jsonFile = [];

			$.ajax({
				url: 'readJSON/'+file,
				async: false,
				dataType: 'json',
				success: function (json) {
					jsonFile = json;
					jsonFile.type = /^resources\//.test(file) ? 'resource' : 'transformation';
				}
			});

			return jsonFile;
		}

        function get_bubbles(conf_files) {
			let bubbles = [];
			let nodeClasses = {};
			for (let key in conf_files) {

				let conf = load_json_file(conf_files[key]);
				let attrib = [];

				let fields = conf_files[key].split('/'), nodeType = fields[0], nodeId = fields[1];

				nodeClasses[nodeId] = { type: nodeType, settings: conf };

				attrib.push('class="draggable_operator btn btn-' + colours[key % colours.length] + ' btn-circle btn-xl"');
				attrib.push('data-node-id="' + nodeId + '"');
				attrib.push('data-node-type="' + nodeType + '"');

				attrib.push('data-toggle="tooltip"');
				attrib.push('data-placement="top"');
				attrib.push('data-original-title="' + conf.info.description + '"');
				bubbles.push('<div ' + attrib.flat().join(' ') + '>' + conf.info.title + '</div>');
			}

			window.nodeClasses = $.extend(nodeClasses, window.nodeClasses);
			window.filenames = {};
			window.pipelineName = 'pipeline';

			return bubbles.join('\n');
		}

        // injecting data operations
        $("#data_area").html(get_bubbles(jsons_data));

		// injecting the transformations
        $("#transformations_area").html(get_bubbles(jsons_transformations));

        // injecting the resources
        $("#resources_area").html(get_bubbles(jsons_resources));

        // the flowchart part
        var $flowchart = $('#chart_area');
        var $container = $flowchart.parent();
        var flowchart_elem = document.getElementById('chart_area');

        var cx = $flowchart.width() / 2;
		var cy = $flowchart.height() / 2;

		// FIXME: it didn't work as described in the manual: $('...').panzoom, so I had to do this
		Panzoom(flowchart_elem);
		// Panzoom initialization...
		//$flowchart.panzoom();

		// Centering panzoom
		//Panzoom(flowchart_elem, 'pan', -cx + $container.width() / 2, -cy + $container.height() / 2);

		// Doesn't work properly for now
		// TODO: fix when there's time
		// // Panzoom zoom handling...
		// var possibleZooms = [0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.90, 0.95, 1];
		// var currentZoom = 2;
		// $container.on('mousewheel.focal', function( e ) {
		// 	e.preventDefault();
		// 	var delta = (e.delta || e.originalEvent.wheelDelta) || e.originalEvent.detail;
		// 	var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
		// 	currentZoom = Math.max(0, Math.min(possibleZooms.length - 1, (currentZoom + (zoomOut * 2 - 1))));
		// 	//$flowchart.flowchart('setPositionRatio', possibleZooms[currentZoom]);
		// 	// Panzoom(flowchart_elem, 'zoom', possibleZooms[currentZoom], {
		// 	// 	animate: false,
		// 	// 	focal: e
		// 	// });
		// 	$flowchart.css('transform', 'scale(' + possibleZooms[currentZoom] + ')');
		// });

		let yasqe;

        // preparing input and output bubbles in the chart area
        const data = {
            operators: {
                input: {
                    top: 1050,
                    left: 2200,
                    properties: {
						title: 'Input',
						action: 'input',
						type: 'data',
						options: [{
							name: "filename",
							label: "Input data",
							type: "file",
							format: "text"
						}],
						inputs: {},
						outputs: {
							output_1: {
								label: 'Uploaded Data'
							}
						}
					}
                },
                output: {
                    top: 1300,
                    left: 3000,
                    properties: {
                        title: 'Output',
						action: 'output',
						type: 'data',
                        options: [{
							name: "filename",
							label: "Destination file",
							value: "System.out"
						}],
                        inputs: {
                            input_1: {
                                label: 'Data Result',
                            }
                        },
                        outputs: {},
                        resources: {}
                    }
                }
            }
        };

        // Option generation part
		function generateOption(option, operator_id, option_index) {
			let option_label = option.label ? option.label : option.name;
			let option_value = option.value ? option.value : '';
			let option_type = option.type ? option.type : 'text';
			let option_help = option.help ? option.help : '';
			let option_required = option.required ? option.required : false;

			let option_id = option.name; // for simplicity later on while updating, but might be prone to errors if names are weird

			let option_html = '<div class="form-group">\n' +
				'<span data-toggle="option-help" data-original-title="' + option_help + '">' +
				'<label for="' + option_id + '"' +
				'">' + option_label + (option_required ? '<span class="required">*</span>' : '') +
				(option_help ? ' <i class="fa fa-question-circle"></i>' : '') +
				'</label></span>';
			let option_html_end = '</div>';

			if (option_type === 'file')
				return option_html +
					'<input type="file" class="form-control-file operator_option"' +
					' name="' + option_id + '"' +
					' data-index="' + option_index + '"' +
					' id="' + option_id + '"' +
					' value="' + option_value +'"/>' +

					option_html_end;

			if (option.values)
				return option_html +
					'<select class="custom-select" id="' + option_id + '" data-index="' + option_index + '">' +
					option.values.map(value => { return '<option ' + (option_value === value ? 'selected' : '') +
						' value="' + value + '">' + value + '</option>'; }) +
					'</select>' + option_html_end;

			if (option_type === 'editor' && option.format === 'sparql')
				return option_html +
					'<div id="' + option_id + '" data-index="' + option_index + '" name="' + option_id + '"></div>' +
					(option.import ?
					'<label for=' + option_id + '_upload"' + 'class="btn">Import data</label>' +
					'<input type="file" class="form-control-file operator_option read-contents"' +
					' name="' + option_id + '_upload"' +
					' data-for="' + option_id + '"' +
					' data-index="' + option_index + '"' +
					' id="' + option_id + '_upload"' : '') +
					option_html_end;

			if (option_type === 'editor')
				return option_html +
					'<textarea id="' + option_id + '" data-index="' + option_index + '" name="' + option_id + '"' +
					(option.import ? '' : ' class="small" ') +
					'>' +
					option_value +
					'</textarea>' +
					(option.import ?
					'<label for=' + option_id + '_upload"' + 'class="btn">Import data</label>' +
					'<input type="file" class="form-control-file operator_option read-contents"' +
					' name="' + option_id + '_upload"' +
					' data-for="' + option_id + '"' +
					' data-index="' + option_index + '"' +
					' data-original-title="test"' +
					' id="' + option_id + '_upload"' : '') +
					option_html_end;

			return option_html +
				'<input type="text"' +
				' class="form-control operator_option' + (option.name === "graph" ? ' copy-filename' : '') + '"' +
				' name="' + option_id + '"' +
				' data-index="' + option_index + '"' +
				' id="' + option_id + '"' +
				' value="' + option_value +'"/>' +
				option_html_end;
		}

		function getOperatorType(operatorData, connector, subConnector) {
			if (operatorData.properties.type === 'resources')
				return 'resource';
			const val = operatorData.properties[connector][subConnector].label;
			if(/Graph/.test(val))
				return 'stream';

			return 'text';
		}

        // Preparing the flowchart plugin
        $flowchart.flowchart({
            data: data,
            distanceFromArrow: 0,
            defaultLinkColor: "#5CB85C",
            defaultSelectedLinkColor: "#D95360",
			multipleLinksOnOutput: true,
			multipleLinksOnInput: true,
            verticalConnection: false,

            // listing behaviour on events
            onLinkSelect: function (linkId) {
            	$("g[data-link_id=" + linkId + "] path").addClass("dashed-line");
                $flowchart.focus();
                return true;
            },

			onLinkCreate(linkId, linkData) {
            	const linkColors = {
            		resource: "#0394BB",
					stream: "#F37043",
					text: "#5CB85C"
            	};

            	const operatorFromType = getOperatorType($flowchart.flowchart('getOperatorData', linkData.fromOperator), 'outputs', linkData.fromConnector);
            	const operatorToType = getOperatorType($flowchart.flowchart('getOperatorData', linkData.toOperator), 'inputs', linkData.toConnector);

            	if(operatorFromType !== operatorToType && operatorFromType !== 'resource')
            		return false;

            	// TODO: Remove if it's too bright
            	linkData.color = linkColors[operatorFromType];
            	return true;
			},

            onLinkUnselect: function () {
                $(".dashed-line").removeClass("dashed-line");
                $("#optionsContent").html('');
                return true;
            },

            onOperatorSelect: function (operatorId) {
                let operator_options = $flowchart.flowchart('getOperatorOptions', operatorId);
                let operator_title = $flowchart.flowchart('getOperatorTitle', operatorId);
                // let operator_data = $flowchart.flowchart('getOperatorData', operatorId);
                let options_count = Object.keys(operator_options).length;
                let options_contents;

                // TODO: populate with description, create another getter in jquery.flowchart.js
                $('#optionsHelp').html('');

                if (options_count > 0) {

                	// Add an option for bubble title
                	options_contents = generateOption({name: 'info.title', label: 'Name', value: operator_title, required: true}, operatorId, "title");
                	operator_options.forEach((option, i) => options_contents += generateOption(option, operatorId, i));

                	$("#optionsContent").html(options_contents).find('input, select, textarea')
						.on('change select',
							function() {
								// special handling of file uploads
								if ($(this).attr('type') === 'file') {
									if ($(this).hasClass('read-contents')) {
										const fileReader = new FileReader();
										fileReader.onload = (e) => {
											operator_options[parseInt($(this).data('index'))].value = e.target.result;
											// copying filename
											const filenameOption = $('.copy-filename');
											if (filenameOption.length) {
												const fileName = $(this).prop('files')[0].name;
												filenameOption.val(fileName);
												operator_options[parseInt(filenameOption.data('index'))].value = fileName;
											}

											$flowchart.flowchart('setOperatorOptions', operatorId, operator_options);
											if (document.getElementById('sparql')) {
												yasqe.setValue(e.target.result);
												setTimeout(function () {
													yasqe.refresh();
												}, 1);
											}
											else
												$('textarea#' + $(this).data('for')).val(e.target.result);


										};
										fileReader.readAsText($(this).prop('files')[0]);
									}
									else {
										const upload = $(this).prop('files')[0];
										const fileName = "data/" + upload.name;
										window.filenames[operatorId] = new File([upload], fileName);
										operator_options[parseInt($(this).data('index'))].value = fileName;
										$flowchart.flowchart('setOperatorOptions', operatorId, operator_options);
									}

								}
								else {
									// setting options in non-file upload cases
									// special handling of the title
									if ($(this).data('index') === "title")
										$flowchart.flowchart('setOperatorTitle', operatorId, $(this).val());
									else {
										operator_options[parseInt($(this).data('index'))].value = $(this).val();
										$flowchart.flowchart('setOperatorOptions', operatorId, operator_options);
									}
								}
						});

                	let queryElem = document.getElementById("sparql");
                	if (queryElem) {
                		yasqe = new YASQE(queryElem, {
                			resizeable: true//,
							//autofocus: true
						});

                		let queryOption = $(queryElem).data('index');
						yasqe.setValue(operator_options[queryOption].value);
						yasqe.on('change', function() {
							operator_options[queryOption].value = yasqe.getValue();
							$flowchart.flowchart('setOperatorOptions', operatorId, operator_options);
						});
						setTimeout(function(){yasqe.refresh();}, 1);
					}

                	$("#options").show("slide", { direction: "right" }, 400);
                	$('[data-toggle="option-help"]').tooltip();
                } else {
                	$("#options").hide("slide", { direction: "right" }, 400);
                }
                return true;
            },

            onOperatorUnselect: function () {
            	$("#options").hide("slide", { direction: "right" }, 400);
                return true;
            }
        }); // $flowchart methods


        // delete service or link button
        $('.delete_selected_button').click(function (event) {
        	event.preventDefault();
        	const operatorId = $flowchart.flowchart('getSelectedOperatorId');
        	delete window.filenames[operatorId];
            $flowchart.flowchart('deleteSelected');

        });

        $flowchart.on('operatorSelect', function(el, operatorId, retHash) { $flowchart.focus(); });
        $flowchart.keyup(function (event) {
        	if ($flowchart.selectedOperatorId !== null) {
        	var code = event.keyCode || event.which;
				if (code == $.ui.keyCode.BACKSPACE || code == $.ui.keyCode.DELETE) {
					event.preventDefault();
					const operatorId = $flowchart.flowchart('getSelectedOperatorId');
					delete window.filenames[operatorId];
					$flowchart.flowchart('deleteSelected');
				}
			}
		});

        // function to get the data from the operators
		function getOperatorData($element) {
			let nodeId = $element.data('node-id');
			let operatorSettings = window.nodeClasses[nodeId].settings;

			let data = {
				properties: {
					title: operatorSettings.info.title,
					type: window.nodeClasses[nodeId].type,
					action: nodeId,
					options: [],
					inputs: {},
					outputs: {},
					resources: {}
				}
			};

			if (operatorSettings.inputs)
				operatorSettings.inputs.forEach((item, i) => data.properties.inputs['input_' + i] = {
					label: item.label,
					name: item.name
				});

			if (operatorSettings.outputs)
				operatorSettings.outputs.forEach((item, i) => data.properties.outputs['output_' + i] = {
					label: item.label,
					name: item.name
				});

			if (operatorSettings.resources) {
				operatorSettings.resources.forEach((item, i) => data.properties.resources['resource_' + i] = {
					label: item.label,
					name: item.name
				});
				data.properties.class = 'flowchart-resource-operator';
			}

			if(operatorSettings.params)
				operatorSettings.params.forEach((item, i) => data.properties.options.push(Object.assign({}, item))); // Object.assign makes a copy

			return data;
		}

        // making the operators draggable
        let operatorId = 0;
        let $draggableOperators = $('.draggable_operator');
        $draggableOperators.draggable({
            cursor: "move",
            opacity: 0.7,
            appendTo: 'body',
            zIndex: 1000,
            helper: function () {
            	$flowchart.css('transform', 'scale(1.0)');
                let $this = $(this);
                let data = getOperatorData($this);
                return $flowchart.flowchart('getOperatorElement', data);
            },
            stop: function (e, ui) {
                let $this = $(this);
                let elOffset = ui.offset;
                let containerOffset = $container.offset();
                if (elOffset.left > containerOffset.left &&
                    elOffset.top > containerOffset.top &&
                    elOffset.left < containerOffset.left + $container.width() &&
                    elOffset.top < containerOffset.top + $container.height()) {

                    let flowchartOffset = $flowchart.offset();

                    let relativeLeft = elOffset.left - flowchartOffset.left;
                    let relativeTop = elOffset.top - flowchartOffset.top;

                    let positionRatio = $flowchart.flowchart('getPositionRatio');
                    relativeLeft /= positionRatio;
                    relativeTop /= positionRatio;

                    let data = getOperatorData($this);
                    data.left = relativeLeft;
                    data.top = relativeTop;

                    $flowchart.flowchart('addOperator', data);
                }
            }
        }); // $draggableOperators.draggable

		$('#pipelineClear').on('click', function() {
			$flowchart.flowchart('setData', {});
			window.filenames = {};
			window.pipelineName = 'pipeline';
		});

		$('#pipelineDownload').on('click', function() {
			const text = JSON.stringify($flowchart.flowchart('getData'), null, 2);
			let el = document.createElement('a');
			el.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
			el.setAttribute('download', window.pipelineName + '.json');
			el.style.display = 'none';
			document.body.appendChild(el);

			el.click();
			document.body.removeChild(el);
		});

		$('#resultsDownload').on('click', function() {
			const text = $('#results-text').html();
			let el = document.createElement('a');
			el.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
			el.setAttribute('download', 'results.txt');
			el.style.display = 'none';
			document.body.appendChild(el);

			el.click();
			document.body.removeChild(el);
		});

		$('#pipelineSave').on('click', function () {
			const filename = $('#modal-save-pipeline-name').val();
			const content = $('#modal-save-pipeline-json').val();

			if (filename == '' || content == '') {
				alert('Fields cannot be empty');
				return;
			}

			let pipelines = window.localStorage.getItem('fintan_pipelines');
			pipelines = (pipelines === null ? {} : JSON.parse(pipelines));
			pipelines[filename] = JSON.parse(content);

			window.localStorage.setItem('fintan_pipelines', JSON.stringify(pipelines, null, 2));

			$('#modalSave').modal('hide');
		});

		$('#pipelineLoad').on('click', function () {
			// let pipelines = window.localStorage.getItem('fintan_pipelines');
			// if (pipelines === null) {
			// 	alert('There are no saved pipelines');
			// 	return;
			// }

			let content = JSON.parse($('#modal-pipeline-load-json').val());
			$('#chart_area').flowchart('setData', content.data ? content.data : content);
			window.filenames = content.filenames ? content.filenames : {};
			$('#modalLoad').modal('hide');
		});

		function uploadResourceFile(resource, component, resourceOperatorId, type) {
			const typeSettings = {
				"load_xsl.yaml": {
					extension: ".xsl",
					optionIndex: 0,
					errorMsg: "XSLT not specified"
				},
				"load_sparql.yaml": {
					extension: ".sparql",
					optionIndex: 0,
					errorMsg: "SPARQL query not specified for a SPARQL resource"
				},
				"load_rdf.yaml": {
					extension: ".rdf",
					optionIndex: 1,
					errorMsg: "RDF data is empty"
				}
			};

			const rdfExtensions = {
				'Turtle': '.ttl',
				'RDF/XML': '.rdf',
				'N-Triples': '.n3'
			};

			if (!(type in typeSettings))
				throw new PipelineError('Unknown resource type: ' + type);

			// let filename = 'data/' + resource.title.replace(" ", "-") + "_" + operatorId + "_" + component.id + typeSettings[type].extension;
			let extension = typeSettings[type].extension;
			// TODO: I don't like this hardcoded solution. Maybe changing typeSettings to have a function
			//  returning an object instead of a dict
			if (type === 'load_rdf.yaml')
				extension = rdfExtensions[resource.options[2].value];

			let filename = 'data/' + resource.title.replace(" ", "-") + "_" + resourceOperatorId + extension;
			let value = resource.options[typeSettings[type].optionIndex].value;
			if (!value)
				throw new PipelineError(typeSettings[type].errorMsg);
			window.filenames[resourceOperatorId] = new File([value], filename, { type: "text/plain"} );

			return filename;
		}

		function processResource(resource, component, resourceOperatorId) {
			// I am NOT SURE that hardcoding everything about our resource components is the best approach.
			// On the other hand, they are of pretty basic formats
			switch (component.class) {
				case "XSLTStreamTransformer": {
					if (resource.action === 'load_xsl.yaml') {
						const filename = uploadResourceFile(resource, component, resourceOperatorId, resource.action);
						component.xsl = (filename + " "  + (component.args ? component.args : "")).trim();
					}
					break;
				}
				case "RDFUpdater": {
					if (resource.action === 'load_rdf.yaml') {
						let graph = resource.options[0].value;
						if (!graph)
							// We don't set the graph name to the filename because if it wasn't imported, users might not know this name
							throw new PipelineError('Graph name not specified for an RDF resource');
						if (!/^https?:\/\/.*/.test(graph))
							graph = "http://" + graph;

						const filename = uploadResourceFile(resource, component, resourceOperatorId, resource.action);

						if (!component.models)
							component.models = [];
						component.models.push({source: filename, graph: graph});
					}

					if (resource.action === 'load_sparql.yaml') {
						const filename = uploadResourceFile(resource, component, resourceOperatorId, resource.action);

						if (!component.updates)
							component.updates = [];
						// we are using titles to sort sparql queries in JSON
						component.updates.push({path: filename, iter: 1, name: resource.title});
					}

					break;
				}
				case "SparqlStreamWriter":
				case "TarqlStreamTransformer":
				case "SparqlStreamTransformerTDB": {
					if (resource.action === 'load_sparql.yaml') {
						const filename = uploadResourceFile(resource, component, resourceOperatorId, resource.action);
						component.query = filename;
					}
					break;
				}
				case "RDFStreamSplitterTDB": {
					const propertyNames = {
						iterat: "iteratorQuery",
						construct: "constructQuery",
						init: "initUpdate",
						recurs: "recursiveUpdate"
					};

					const filename = uploadResourceFile(resource, component, resourceOperatorId, resource.action);
					const resName = resource.title
						.toLowerCase()
						.replace(/ |(e|or)$|update$|(e|or)?query$|(e|ive)?update$/, "");

					if (!(resName in propertyNames))
						throw new PipelineError('Cannot assign resource to a property: ' + resource.title);

					component[propertyNames[resName]] = filename;
					break;
				}
				case "CoNLLRDFFormatter": {
					if (resource.action === 'load_sparql.yaml') {
						if (component.modules[0].mode !== 'SPARQLTSV')
							throw new PipelineError('Only SPARQLTSV mode of CoNLLRDFFormatter supports a SPARQL SELECT');

						const filename = uploadResourceFile(resource, component, resourceOperatorId, resource.action);
						component.modules[0].filename = filename;
					}
				}
			}

			return component;
		}

		function getInstanceName(instanceType, id) {
			return instanceType + "_" + id;
		}

		function getSourceName(component) {
			// TODO: this condition is questionable, we actually need to make sure that these filenames are non-empty
			return component.options[0].value ? component.options[0].value : "";
		}

		function getStreamObject(sourceId, source, targetId, target) {
			let stream = {};

			const isSrcData = source !== null && source.type === "data";
			const isTgtData = target !== null && target.type === "data";

			if (isSrcData)
				stream.readsFromSource = source !== null ? getSourceName(source) : sourceId;
			else {
				stream.readsFromInstance = source !== null ? getInstanceName(source.action, sourceId) : sourceId;
				stream.readsFromInstanceGraph = "";
			}

			if (isTgtData)
				stream.writesToDestination = target !== null ? getSourceName(target) : sourceId;
			else {
				stream.writesToInstance = target !== null ? getInstanceName(target.action, targetId) : targetId;
				stream.writesToInstanceGraph = "";
			}

			return stream;
		}

		// I operate under an assumption that we have only one output. Should work for now
		function isStreamNode(properties)
		{
			return properties.outputs && properties.output_1 && properties.outputs.output_1.label === 'Graph';
		}

		function preprocessComponent(component)
		{
			switch (component.class) {
				case "CoNLLStreamExtractor": {
					component.columns = component.columns ? component.columns.split(' ') : [];
					break;
				}
				case "CoNLLRDFFormatter": {
					if (component.mode === 'RDF' || component.mode === 'CONLL')
						component.modules = [{
								mode: component.mode,
								columns: component.columns ? component.columns.split(' ') : []
					}];
					else
						component.modules = [{mode: component.mode}];

					delete component.mode;
					delete component.columns;

					break;
				}
				case "RDFStreamSplitterTDB": {
					component.deltaStreams = component.deltaStreams ? component.deltaStreams.split('\n') : [];
					component.segmentStreams = component.segmentStreams ? component.segmentStreams.split('\n') : [];
					break;
				}
				case "RDFStreamLoader": {
					if (!component.delimiter)
						component.delimiter = '';
				}
			}

			return component;
		}

		function generatePipelineJSON(data)
		{
			let json = {
				configVer: "2",
				// we can't use it in Fintan alongside streams and components, we need special handling of "Input" and "Output" bubbles
				// input: data.operators.input ? data.operators.input.properties.options[0].value : null,
				// output: data.operators.output ? data.operators.output.properties.options[0].value : null,
				input: null,
				output: null,
				pipeline: null,
				components: [],
				streams: []
			};

			let componentIdMapping = {};
			for (const [key, val] of Object.entries(data.operators)) {
				if (key !== "input" &&  key !== "output" && val.properties.type === 'transformations') {
					let elemData = val.properties;
					let component = {
						componentInstance: getInstanceName(elemData.action, key),
						class: window.nodeClasses[elemData.action].settings.info.class,
						// TODO: slowly remove using this since we use componentInstance as a primary key
						id: key
					};

					for(const {name, value} of elemData.options.map(item => { return { name: item.name, value: item.value ? item.value : null }; }))
						component[name] = value;
					componentIdMapping[key] = json.components.length;
					json.components.push(preprocessComponent(component));
				}
			}

			// let's group all the connections by their starting point to know where to put duplicators
			// and resources we can already glue to their components (we'll omit file upload for right now)
			let connections = {};
			for (const [key, val] of Object.entries(data.links)) {
				if (val.fromConnector.startsWith('resource'))
					json.components[componentIdMapping[val.toOperator]] = processResource(data.operators[val.fromOperator].properties,
						json.components[componentIdMapping[val.toOperator]], val.fromOperator);
				else {
					if (!connections[val.fromOperator])
						connections[val.fromOperator] = [];
					connections[val.fromOperator].push(val.toOperator);
				}
			}

			for (let i = 0; i < json.components.length; i++) {
				if (json.components[i].updates && json.components[i].updates.length)
					json.components[i].updates.sort(function (a, b) {
						if (a.name === b.name)
							return 0;
						return (a.name > b.name ? 1 : -1)
					});
			}

			// Now we can create duplicators and streams
			for (const [key, val] of Object.entries(connections)) {
				if (val.length > 1) {
					let dupl_stream = "dupl_" +  key;
					json.components.push({
						componentInstance: dupl_stream,
						class: isStreamNode(data.operators[key].properties) ? "RDFStreamDuplicator" : "IOStreamDuplicator"
					});

					// adding one stream from source to the duplicator
					json.streams.push(getStreamObject(key, data.operators[key].properties, dupl_stream, null));

					// and one stream for each value from the duplicator to the value
					val.forEach(id => json.streams.push(getStreamObject(dupl_stream, null, id, data.operators[id].properties)));
				}
				else
					json.streams.push(getStreamObject(key, data.operators[key].properties, val, data.operators[val].properties));
			}

			return json;
		}

		$('#pipelineGenerate').on('click', function (e) {
			// here we are generating JSON pipeline, this is going to be interesting
			const data = $flowchart.flowchart('getData');
			try {
				json = generatePipelineJSON(data);
			} catch (ex) {
				if (ex instanceof PipelineError) {
					alert('Validation error: ' + ex.message);
					//$('#validationAlert span').val('Validation error: ' + e.message);
					//$('#validationAlert').show();
					e.stopPropagation();
					return;
				}
			}

			// saving the pipeline
			// window.pipeline = new File([JSON.stringify(json, null, 2)], window.pipelineName + ".json");
			window.pipeline = JSON.stringify(json, null, 2); // TODO: maybe change this behaviour later, this is to allow us replace paths in the JSON after pipeline rename
			let ulFiles = $('#uploadFiles');
			ulFiles.find('li').remove();
			for (const [key, val] of Object.entries(window.filenames)) {
				if (!val.name) {
					alert('Some files are not uploaded. If you have loaded the configuration please upload the files once again');
					e.stopPropagation();
					return false;
				}
				ulFiles.append($('<li class="list-group-item">' + val.name + '</li>'));
			}
			// ulFiles.append($('<li class="list-group-item">pipeline.json</li>'));

			$('#modal-generate-pipeline-name').val(window.pipelineName);
		});

		$('#modal-generate-pipeline-name').on('change', function () {
			window.pipelineName = $(this).val();
		});

		$('#getJson').on('click', function () {
			saveAs(new File([window.pipeline.replaceAll('"data/', '"' + window.pipelineName + '/data/')], window.pipelineName + ".json"), window.pipelineName + ".json");
			$('#modalGenerate').modal('hide');
		});

		$('#uploadPipeline').on('click', function () {
			// $('#selectServer').show();
		});

		$('#getZip').on('click', function () {
			let zip = new JSZip();
			zip.file(window.pipelineName + '/' + window.pipelineName + '.json', window.pipeline.replaceAll('"data/', '"' + window.pipelineName + '/data/'));

			for (const [key, val] of Object.entries(window.filenames))
				zip.file(window.pipelineName + '/' + val.name, val);

			fetch('/service-dockerfile')
				.then(response => response.text())
				.then(data => {
					zip.file(window.pipelineName + '/Dockerfile', data, {binary: false});
					zip.generateAsync({type:"blob"})
						.then(function(content) {
							saveAs(content, pipelineName + ".zip");
							$('#modalGenerate').modal('hide');
						});
				});
		});

		$('#modalChooseServer')
			.on('show.bs.modal', function () {
				$('#modal-server-address').val('http://localhost:8080');
			})
			.on('shown.bs.modal', function (event) {
				$('#modal-server-address').trigger('focus');
		});

		function uploadFile(file, type, url, pipelineName='') {
			// file = File, file.name = filename
			const formData = new FormData();

    		// add assoc key values, this will be posts values
    		formData.append('file', file, file.name);
    		formData.append('type', type);
    		if(type !== 'pipeline') {
    			formData.append('pipeline', pipelineName);
			}

    		const response = $.ajax({
				url: url + '/api/upload',
				async: false,
				cache: false,
				data: formData,
				contentType: false,
				processData: false,
				crossDomain: true,
				headers: {
					accept: "application/json",
					"Access-Control-Allow-Origin": "x-requested-with"
				},
				beforeSend: function(xhr){
					xhr.withCredentials = true;
                },
				method: 'POST'
			});
		}

		function uploadAndRunPipeline(server, data) {
			try {
				json = generatePipelineJSON(data);
			} catch (ex) {
				if (ex instanceof PipelineError) {
					alert('Validation error: ' + ex.message);
					//$('#validationAlert span').val('Validation error: ' + e.message);
					//$('#validationAlert').show();
					e.stopPropagation();
					return;
				}
			}

			json = JSON.stringify(json, null, 2);
			let pipelineName = 'pipeline-' + Date.now();
			let pipeline = new File([json.replaceAll('"data/', '"' + pipelineName + '/data/')], pipelineName + ".json");

			uploadFile(pipeline, 'pipeline', server);
			for (const [key, val] of Object.entries(window.filenames)) {
				if (!val.name) {
					alert('Some files are not uploaded. If you have loaded the configuration please upload the files once again');
					e.stopPropagation();
					return false;
				}
				uploadFile(val, 'data', server, pipelineName);
			}

			const response = $.ajax({
				url: server + '/api/run/' + pipelineName,
				async: false,
				cache: false,
				method: 'POST'
			});

			return response;
		}

		function checkServer(url) {
			const response = $.ajax({
				url: url + '/api/docs',
				async: false,
				cache: false
			});

			console.log(response);
			if (response.status !== 200) {
				alert('Error running the pipeline: ' + response.status)
			}
			return response;
		}

		$('#selectServer').on('click', function (event) {
			const server = $('#modal-server-address').val();
			const data = $flowchart.flowchart('getData');

			if (checkServer(server)) {
				$(this).html('Running...').attr("disabled", true);

				const result = uploadAndRunPipeline(server, data);

				console.log(result.responseJSON);
				if(result.status === 200) {
					console.log(result.responseJSON.result);
					$('#results-text').html(result.responseJSON.result);
					$("#results").modal('show');
				}

				$('#modalChooseServer').modal('hide');
				$('#modalGenerate').modal('hide');
			} else {
				alert('Server returned an error: ' + result.json);
			}

			$(this).html('Select and run').attr('disabled', false);
		});

		$('#modal-server-address').on('keyup', function(event) {
			if (event.which === 13)
				$('#selectServer').trigger('click');
		});

		$('#modalSave')
			.on('show.bs.modal', function (event) {
				$('#modal-save-pipeline-name').val('');
				let data = $('#chart_area').flowchart('getData');
				let pipelineJson = JSON.stringify({data: data, filenames: window.filenames}, null, 2);
				$('#modal-save-pipeline-json').val(pipelineJson);
			})
			.on('shown.bs.modal', function (event) {
				$('#modal-save-pipeline-name').trigger('focus');
		});

		$('#modalLoad').on('show.bs.modal', function (event) {
			$('#modal-save-pipeline-name').val('');
			let pipelines = window.localStorage.getItem('fintan_pipelines');
			if (pipelines === null) {
				alert('There are no saved pipelines');
				$('#modalLoad').modal('hide');
				return;
			}

			let pipelines_array = Object.entries(JSON.parse(pipelines));
			let dropdown = $('#dropdownLoad');
			dropdown.find('.option-load-pipeline').remove().end();
			$('#dropdownMenuButton').text('Choose a pipeline');

			$.each(pipelines_array, function(key, entry)
			{
				dropdown.append($('<option class="option-load-pipeline"></option>').attr('value', entry[0]).text(entry[0]));
			});
			dropdown.change(
					function() {
						let pipelines = JSON.parse(window.localStorage.getItem('fintan_pipelines'));
						let value = $( "#dropdownLoad option:selected" ).text();
						$('#modal-pipeline-load-json').val(JSON.stringify(pipelines[value], null, 2));
					});
		})
			.on('shown.bs.modal', function (event) {
				$('#dropdownLoad').trigger('focus');
			});

		$('#modal-save-pipeline-name').on('keyup', function(event) {
			if (event.which === 13)
				$('#pipelineSave').trigger('click');
		});
    }); // jquery ready
}; // window.onLoad